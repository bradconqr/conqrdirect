/*
  # Add community tables and functions

  1. New Tables
    - `community_posts` - Stores community posts from creators and users
    - `community_comments` - Stores comments on community posts
    - `community_likes` - Tracks likes on posts
    - `community_comment_likes` - Tracks likes on comments

  2. Security
    - Enable RLS on all tables
    - Add policies for users to interact with community content
    
  3. Functions
    - `get_community_active_users` - Counts unique users engaged in a community
*/

-- Create community_posts table
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creators(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_announcement BOOLEAN DEFAULT false,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create community_comments table
CREATE TABLE IF NOT EXISTS public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create community_likes table for post likes
CREATE TABLE IF NOT EXISTS public.community_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create community_comment_likes table for comment likes
CREATE TABLE IF NOT EXISTS public.community_comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES community_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comment_likes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for community_posts
CREATE POLICY "Creators can manage their community posts"
  ON public.community_posts
  USING (creator_id IN (
    SELECT id FROM creators WHERE user_id = auth.uid()
  ));

CREATE POLICY "Creators can insert new posts in their community"
  ON public.community_posts
  FOR INSERT
  WITH CHECK (
    creator_id IN (SELECT id FROM creators WHERE user_id = auth.uid()) OR 
    auth.uid() = author_id
  );

CREATE POLICY "Authors can update their own posts"
  ON public.community_posts
  FOR UPDATE
  USING (author_id = auth.uid());
  
CREATE POLICY "Authors can delete their own posts"
  ON public.community_posts
  FOR DELETE
  USING (author_id = auth.uid());

-- Create RLS policies for community_comments
CREATE POLICY "Users can view all comments"
  ON public.community_comments FOR SELECT
  USING (true);
  
CREATE POLICY "Users can add comments to any post"
  ON public.community_comments FOR INSERT
  WITH CHECK (auth.uid() = author_id);
  
CREATE POLICY "Users can delete their own comments"
  ON public.community_comments FOR DELETE
  USING (author_id = auth.uid());

-- Create RLS policies for community_likes
CREATE POLICY "Users can view all likes"
  ON public.community_likes FOR SELECT
  USING (true);
  
CREATE POLICY "Users can add likes"
  ON public.community_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can remove their own likes"
  ON public.community_likes FOR DELETE
  USING (user_id = auth.uid());

-- Create RLS policies for community_comment_likes
CREATE POLICY "Users can view all comment likes"
  ON public.community_comment_likes FOR SELECT
  USING (true);
  
CREATE POLICY "Users can add comment likes"
  ON public.community_comment_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can remove their own comment likes"
  ON public.community_comment_likes FOR DELETE
  USING (user_id = auth.uid());

-- Create function to get active users in a community
CREATE OR REPLACE FUNCTION public.get_community_active_users(p_creator_id UUID)
RETURNS TABLE (user_id UUID)
LANGUAGE SQL SECURITY DEFINER
AS $$
  -- Get unique users who have posted or commented in this community
  SELECT DISTINCT u.id
  FROM auth.users u
  WHERE 
    -- User has created posts
    EXISTS (
      SELECT 1 
      FROM community_posts p 
      WHERE p.author_id = u.id AND p.creator_id = p_creator_id
    )
    OR
    -- User has commented on posts
    EXISTS (
      SELECT 1 
      FROM community_comments c
      JOIN community_posts p ON c.post_id = p.id
      WHERE c.author_id = u.id AND p.creator_id = p_creator_id
    )
    OR
    -- User has liked posts
    EXISTS (
      SELECT 1 
      FROM community_likes l
      JOIN community_posts p ON l.post_id = p.id
      WHERE l.user_id = u.id AND p.creator_id = p_creator_id
    );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_community_active_users(UUID) TO authenticated;

-- Add triggers to update post and comment like counts

-- Function to update post like count
CREATE OR REPLACE FUNCTION update_post_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment the likes count
    UPDATE community_posts
    SET likes = likes + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement the likes count
    UPDATE community_posts
    SET likes = GREATEST(0, likes - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update comment like count
CREATE OR REPLACE FUNCTION update_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment the likes count
    UPDATE community_comments
    SET likes = likes + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement the likes count
    UPDATE community_comments
    SET likes = GREATEST(0, likes - 1)
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER after_community_like_change
AFTER INSERT OR DELETE ON community_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_like_count();

CREATE TRIGGER after_community_comment_like_change
AFTER INSERT OR DELETE ON community_comment_likes
FOR EACH ROW
EXECUTE FUNCTION update_comment_like_count();