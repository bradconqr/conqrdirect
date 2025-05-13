import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Button } from '../../components/ui/Button';
import { Card, CardContent } from '../../components/ui/Card';
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  X,
  ThumbsUp,
  MessageCircle,
  Edit2,
  Trash2,
  RefreshCw,
  Clock,
  Image as ImageIcon,
  Video,
  File,
  Upload,
  Camera,
  XCircle
} from 'lucide-react';
import { sanitizeFilename } from '../../lib/fileStorage';

interface Post {
  id: string;
  creator_id: string;
  author_id: string;
  title: string;
  content: string;
  likes: number;
  created_at: string;
  updated_at: string;
  is_announcement?: boolean;
  media_url?: string;
  media_type?: string;
  author?: {
    email: string;
    full_name: string | null;
  };
  comments_count?: number;
  is_liked_by_user?: boolean;
}

interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  likes: number;
  created_at: string;
  author?: {
    email: string;
    full_name: string | null;
  };
  is_liked_by_user?: boolean;
}

export const CreatorCommunityPage: React.FC = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'announcements' | 'media'>('all');
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  // New post state
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    isAnnouncement: false,
    mediaFile: null as File | null,
    mediaType: '',
    mediaPreview: ''
  });
  
  // Comment state
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  
  // Edit post state
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchCreatorId = async () => {
      try {
        const { data, error } = await supabase
          .from('creators')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setCreatorId(data.id);
          fetchCommunityPosts(data.id);
        } else {
          setError('Could not find your creator profile.');
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Error fetching creator ID:', err);
        setError('Could not fetch your creator profile.');
        setLoading(false);
      }
    };

    fetchCreatorId();
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!creatorId) return;

    // Subscribe to new posts
    const postsChannel = supabase
      .channel('community_posts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_posts',
        filter: `creator_id=eq.${creatorId}`
      }, () => {
        fetchCommunityPosts(creatorId);
      })
      .subscribe();

    // Subscribe to new comments
    const commentsChannel = supabase
      .channel('community_comments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'community_comments'
      }, (payload) => {
        // Only refresh comments for the affected post
        if (payload.new && comments[payload.new.post_id]) {
          fetchCommentsForPost(payload.new.post_id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [creatorId, comments]);

  const fetchCommunityPosts = async (creatorId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Get the posts first
      const { data: posts, error: postsError } = await supabase
        .from('community_posts')
        .select('*')
        .eq('creator_id', creatorId)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      if (!posts) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // For each post, get the author info separately
      const postsWithAuthorInfo = await Promise.all(posts.map(async (post) => {
        // Get author info from auth.users
        const { data: authorData, error: authorError } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', post.author_id)
          .maybeSingle();

        // Count comments for this post
        const { count, error: countError } = await supabase
          .from('community_comments')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', post.id);

        if (countError) {
          console.error('Error counting comments:', countError);
        }

        // Check if current user has liked this post
        const { data: likes, error: likesError } = await supabase
          .from('community_likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', user?.id)
          .maybeSingle();

        if (likesError) {
          console.error('Error checking post likes:', likesError);
        }

        return {
          ...post,
          author: authorError ? null : authorData,
          comments_count: count || 0,
          is_liked_by_user: !!likes
        };
      }));

      setPosts(postsWithAuthorInfo);
    } catch (err: any) {
      console.error('Error fetching community posts:', err);
      setError('Failed to load community posts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCommentsForPost = async (postId: string) => {
    try {
      // Get the comments first
      const { data: commentsData, error: commentsError } = await supabase
        .from('community_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      if (!commentsData) {
        setComments(prev => ({
          ...prev,
          [postId]: []
        }));
        return;
      }

      // Get author info for each comment
      const commentsWithAuthorInfo = await Promise.all(commentsData.map(async (comment) => {
        // Get author info
        const { data: authorData, error: authorError } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', comment.author_id)
          .maybeSingle();

        // Check if current user has liked this comment
        const { data: likes, error: likesError } = await supabase
          .from('community_comment_likes')
          .select('id')
          .eq('comment_id', comment.id)
          .eq('user_id', user?.id)
          .maybeSingle();

        if (likesError) {
          console.error('Error checking comment likes:', likesError);
        }

        return {
          ...comment,
          author: authorError ? null : authorData,
          is_liked_by_user: !!likes
        };
      }));

      setComments(prev => ({
        ...prev,
        [postId]: commentsWithAuthorInfo
      }));
    } catch (err) {
      console.error('Error fetching comments for post:', err);
    }
  };

  const refreshData = async () => {
    if (!creatorId || refreshing) return;
    setRefreshing(true);
    await fetchCommunityPosts(creatorId);
    setRefreshing(false);
  };

  const toggleLikePost = async (postId: string, isLiked: boolean) => {
    if (!user) return;

    try {
      if (isLiked) {
        // Unlike the post
        await supabase
          .from('community_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        // Update UI optimistically
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, likes: post.likes - 1, is_liked_by_user: false } 
            : post
        ));
      } else {
        // Like the post
        await supabase
          .from('community_likes')
          .insert({
            post_id: postId,
            user_id: user.id,
            created_at: new Date().toISOString()
          });

        // Update UI optimistically  
        setPosts(posts.map(post => 
          post.id === postId 
            ? { ...post, likes: post.likes + 1, is_liked_by_user: true } 
            : post
        ));
      }
    } catch (err) {
      console.error('Error toggling post like:', err);
    }
  };

  const toggleLikeComment = async (commentId: string, postId: string, isLiked: boolean) => {
    if (!user) return;

    try {
      if (isLiked) {
        // Unlike the comment
        await supabase
          .from('community_comment_likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);

        // Update UI optimistically
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId].map(comment => 
            comment.id === commentId 
              ? { ...comment, likes: comment.likes - 1, is_liked_by_user: false } 
              : comment
          )
        }));
      } else {
        // Like the comment
        await supabase
          .from('community_comment_likes')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            created_at: new Date().toISOString()
          });

        // Update UI optimistically
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId].map(comment => 
            comment.id === commentId 
              ? { ...comment, likes: comment.likes + 1, is_liked_by_user: true } 
              : comment
          )
        }));
      }
    } catch (err) {
      console.error('Error toggling comment like:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      setError('Only image and video files are supported');
      return;
    }

    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    
    // Update state with the file info
    setNewPost({
      ...newPost,
      mediaFile: file,
      mediaType: isImage ? 'image' : 'video',
      mediaPreview: previewUrl
    });
  };

  const handleUploadClick = (type: 'image' | 'video') => {
    if (type === 'image') {
      fileInputRef.current?.click();
    } else if (type === 'video') {
      videoInputRef.current?.click();
    }
  };

  const clearMedia = () => {
    setNewPost({
      ...newPost,
      mediaFile: null,
      mediaType: '',
      mediaPreview: ''
    });
    
    // Also reset the file input
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!creatorId || !user) {
      setError('You must be logged in to create a post.');
      return;
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      setError('Post title and content are required.');
      return;
    }

    try {
      let mediaUrl = '';
      
      // If there's a media file, upload it first
      if (newPost.mediaFile) {
        // Sanitize the filename to remove problematic characters
        const timestamp = Date.now();
        const originalName = newPost.mediaFile.name;
        const sanitizedName = sanitizeFilename(originalName);
        const fileName = `${timestamp}-${sanitizedName}`;
        
        const { data, error: uploadError } = await supabase.storage
          .from('community-media')
          .upload(fileName, newPost.mediaFile);
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('community-media')
          .getPublicUrl(data.path);
          
        mediaUrl = urlData.publicUrl;
      }

      // Create the post with media URL if available
      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          creator_id: creatorId,
          author_id: user.id,
          title: newPost.title.trim(),
          content: newPost.content.trim(),
          is_announcement: newPost.isAnnouncement,
          media_url: mediaUrl || null,
          media_type: newPost.mediaType || null,
          likes: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) throw error;

      // Reset the form and close the modal
      setNewPost({ 
        title: '', 
        content: '', 
        isAnnouncement: false, 
        mediaFile: null, 
        mediaType: '', 
        mediaPreview: '' 
      });
      setIsCreatePostModalOpen(false);

      // Refresh posts
      if (creatorId) {
        fetchCommunityPosts(creatorId);
      }
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post. Please try again.');
    }
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingPost || !creatorId) return;

    try {
      const { error } = await supabase
        .from('community_posts')
        .update({
          title: editingPost.title,
          content: editingPost.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPost.id);

      if (error) throw error;

      // Reset the form and close the modal
      setEditingPost(null);
      setIsEditPostModalOpen(false);

      // Refresh posts
      fetchCommunityPosts(creatorId);
    } catch (err: any) {
      console.error('Error updating post:', err);
      setError(err.message || 'Failed to update post. Please try again.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      // Refresh posts
      if (creatorId) {
        fetchCommunityPosts(creatorId);
      }
    } catch (err: any) {
      console.error('Error deleting post:', err);
      setError(err.message || 'Failed to delete post. Please try again.');
    }
  };

  const handleSubmitComment = async (postId: string) => {
    if (!user || !newComment[postId]?.trim()) return;

    try {
      const { error } = await supabase
        .from('community_comments')
        .insert({
          post_id: postId,
          author_id: user.id,
          content: newComment[postId].trim(),
          likes: 0,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // Clear the comment input
      setNewComment(prev => ({
        ...prev,
        [postId]: ''
      }));

      // Fetch updated comments for this post
      fetchCommentsForPost(postId);
      
      // Update post comment count
      setPosts(posts.map(post => 
        post.id === postId
          ? { ...post, comments_count: (post.comments_count || 0) + 1 }
          : post
      ));
    } catch (err) {
      console.error('Error submitting comment:', err);
    }
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('community_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // Remove the deleted comment from state
      setComments(prev => ({
        ...prev,
        [postId]: prev[postId].filter(comment => comment.id !== commentId)
      }));

      // Update post comment count
      setPosts(posts.map(post => 
        post.id === postId && post.comments_count && post.comments_count > 0
          ? { ...post, comments_count: post.comments_count - 1 }
          : post
      ));
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  const toggleViewComments = async (postId: string) => {
    // If comments are already loaded, just toggle visibility
    if (comments[postId]) {
      setExpandedComments(prev => ({
        ...prev,
        [postId]: !prev[postId]
      }));
      return;
    }

    // Otherwise, fetch comments for this post
    await fetchCommentsForPost(postId);
    
    // And expand the comments section
    setExpandedComments(prev => ({
      ...prev,
      [postId]: true
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInMinutes < 10080) { // Less than a week
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'announcements') {
      return matchesSearch && post.is_announcement;
    } else if (filter === 'media') {
      return matchesSearch && post.media_url;
    }
    
    return matchesSearch;
  });

  const renderMedia = (post: Post) => {
    if (!post.media_url) return null;
    
    if (post.media_type === 'image' || post.media_url.match(/\.(jpeg|jpg|gif|png)$/i)) {
      return (
        <div className="mt-3 rounded-lg overflow-hidden">
          <img 
            src={post.media_url} 
            alt="Post image" 
            className="w-full max-h-96 object-contain bg-gray-100"
          />
        </div>
      );
    } else if (post.media_type === 'video' || post.media_url.match(/\.(mp4|webm|ogg)$/i)) {
      return (
        <div className="mt-3 rounded-lg overflow-hidden">
          <video 
            src={post.media_url} 
            controls 
            className="w-full max-h-96 bg-gray-100"
          />
        </div>
      );
    }
    
    return null;
  };

  const renderMediaPreview = () => {
    if (!newPost.mediaPreview) return null;
    
    if (newPost.mediaType === 'image') {
      return (
        <div className="mt-4 relative">
          <img 
            src={newPost.mediaPreview} 
            className="max-h-64 rounded-lg border border-gray-200" 
            alt="Preview"
          />
          <button 
            onClick={clearMedia}
            className="absolute top-2 right-2 bg-gray-800 bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      );
    } else if (newPost.mediaType === 'video') {
      return (
        <div className="mt-4 relative">
          <video 
            src={newPost.mediaPreview} 
            className="max-h-64 w-full rounded-lg border border-gray-200" 
            controls
          />
          <button 
            onClick={clearMedia}
            className="absolute top-2 right-2 bg-gray-800 bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-purple-700 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community</h1>
          <p className="mt-2 text-gray-600">Manage your community discussions and announcements</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshData}
            leftIcon={<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />}
            disabled={refreshing}
          >
            Refresh
          </Button>
          <Button 
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsCreatePostModalOpen(true)}
          >
            Create Post
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mt-8 bg-white shadow-sm rounded-lg">
        <div className="p-4 flex flex-col md:flex-row justify-between items-center space-y-3 md:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search posts..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex items-center">
              <div className="relative inline-block text-left">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="min-w-40"
                  leftIcon={<Filter className="h-4 w-4" />}
                >
                  Filter: {filter === 'all' ? 'All Posts' : 
                           filter === 'announcements' ? 'Announcements' : 
                           'Media Posts'}
                </Button>
                <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      className={`block px-4 py-2 text-sm w-full text-left ${filter === 'all' ? 'text-purple-700 bg-purple-50' : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setFilter('all')}
                    >
                      All Posts
                    </button>
                    <button
                      className={`block px-4 py-2 text-sm w-full text-left ${filter === 'announcements' ? 'text-purple-700 bg-purple-50' : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setFilter('announcements')}
                    >
                      Announcements
                    </button>
                    <button
                      className={`block px-4 py-2 text-sm w-full text-left ${filter === 'media' ? 'text-purple-700 bg-purple-50' : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={() => setFilter('media')}
                    >
                      Media Posts
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {filteredPosts.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No posts yet</h3>
            <p className="mt-1 text-gray-500">Get started by creating your first post for your community.</p>
            <Button
              className="mt-4"
              onClick={() => setIsCreatePostModalOpen(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create First Post
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredPosts.map(post => (
              <div key={post.id} className="p-6">
                <div className="flex justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-700">
                          {post.author?.full_name?.charAt(0) || post.author?.email?.charAt(0) || 'U'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-medium text-gray-900">{post.title}</h3>
                        {post.is_announcement && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Announcement
                          </span>
                        )}
                        {post.media_url && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {post.media_type === 'image' || post.media_url.match(/\.(jpeg|jpg|gif|png)$/i) 
                              ? 'Image' 
                              : 'Video'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {post.author?.full_name || post.author?.email} • {formatDate(post.created_at)}
                        {post.created_at !== post.updated_at && ' (edited)'}
                      </p>
                      <div className="mt-2 text-gray-700 whitespace-pre-wrap">
                        {post.content}
                      </div>
                      
                      {/* Render post media */}
                      {renderMedia(post)}
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="relative">
                      <button
                        onClick={() => setSelectedPost(selectedPost === post.id ? null : post.id)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                      
                      {selectedPost === post.id && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                          <div className="py-1" role="menu">
                            <button
                              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => {
                                setEditingPost(post);
                                setIsEditPostModalOpen(true);
                                setSelectedPost(null);
                              }}
                            >
                              <Edit2 className="h-4 w-4 inline mr-2" />
                              Edit Post
                            </button>
                            <button
                              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                              onClick={() => {
                                handleDeletePost(post.id);
                                setSelectedPost(null);
                              }}
                            >
                              <Trash2 className="h-4 w-4 inline mr-2" />
                              Delete Post
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-4 text-sm">
                  <button 
                    className={`flex items-center space-x-1 ${post.is_liked_by_user ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => toggleLikePost(post.id, !!post.is_liked_by_user)}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{post.likes || 0}</span>
                  </button>

                  <button 
                    className="flex items-center space-x-1 text-gray-500 hover:text-gray-700"
                    onClick={() => toggleViewComments(post.id)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>{post.comments_count || 0} Comments</span>
                  </button>
                </div>

                {/* Comments section */}
                {expandedComments[post.id] && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {comments[post.id] && comments[post.id].length > 0 ? (
                      <div className="space-y-4">
                        {comments[post.id].map(comment => (
                          <div key={comment.id} className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-700">
                                  {comment.author?.full_name?.charAt(0) || comment.author?.email?.charAt(0) || 'U'}
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 bg-gray-50 rounded-md p-3">
                              <div className="flex justify-between">
                                <div>
                                  <span className="text-sm font-medium text-gray-900">
                                    {comment.author?.full_name || comment.author?.email}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    {formatDate(comment.created_at)}
                                  </span>
                                </div>
                                {(comment.author_id === user?.id) && (
                                  <button
                                    onClick={() => handleDeleteComment(comment.id, post.id)}
                                    className="text-gray-400 hover:text-red-500"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-gray-700">{comment.content}</p>
                              <div className="mt-2 flex items-center space-x-2">
                                <button 
                                  className={`flex items-center space-x-1 text-xs ${comment.is_liked_by_user ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                                  onClick={() => toggleLikeComment(comment.id, post.id, !!comment.is_liked_by_user)}
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                  <span>{comment.likes || 0}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No comments yet. Be the first to comment.</p>
                    )}

                    {/* Add comment form */}
                    <div className="mt-4 flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-xs font-medium text-purple-700">
                            {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'Y'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <textarea
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                          placeholder="Write a comment..."
                          rows={2}
                          value={newComment[post.id] || ''}
                          onChange={(e) => setNewComment({...newComment, [post.id]: e.target.value})}
                        ></textarea>
                        <div className="mt-2 flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleSubmitComment(post.id)}
                            disabled={!newComment[post.id]?.trim()}
                          >
                            Post Comment
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Create Post Modal */}
      {isCreatePostModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  onClick={() => setIsCreatePostModalOpen(false)}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Create New Post
                  </h3>
                  
                  <form onSubmit={handleCreatePost} className="mt-4">
                    <div className="mb-4">
                      <label htmlFor="postTitle" className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        id="postTitle"
                        value={newPost.title}
                        onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        placeholder="Enter post title"
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="postContent" className="block text-sm font-medium text-gray-700 mb-1">
                        Content
                      </label>
                      <textarea
                        id="postContent"
                        value={newPost.content}
                        onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                        rows={6}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        placeholder="Write your post content here..."
                        required
                      ></textarea>
                    </div>
                    
                    {/* Media upload preview */}
                    {renderMediaPreview()}
                    
                    {/* Media upload buttons */}
                    {!newPost.mediaFile && (
                      <div className="mb-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => handleUploadClick('image')}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          <ImageIcon className="h-5 w-5 mr-2 text-gray-500" />
                          Add Image
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleUploadClick('video')}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          <Video className="h-5 w-5 mr-2 text-gray-500" />
                          Add Video
                        </button>
                        
                        {/* Hidden file inputs */}
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                        
                        <input
                          type="file"
                          ref={videoInputRef}
                          onChange={handleFileChange}
                          accept="video/*"
                          className="hidden"
                        />
                      </div>
                    )}
                    
                    <div className="mb-4 flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="isAnnouncement"
                          name="isAnnouncement"
                          type="checkbox"
                          checked={newPost.isAnnouncement}
                          onChange={(e) => setNewPost({...newPost, isAnnouncement: e.target.checked})}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="isAnnouncement" className="font-medium text-gray-700">
                          Mark as announcement
                        </label>
                        <p className="text-gray-500">
                          Announcements will be highlighted and pinned to the top for all users.
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                      <Button type="submit" className="sm:ml-3">
                        Create Post
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreatePostModalOpen(false)}
                        className="mt-3 sm:mt-0"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Post Modal */}
      {isEditPostModalOpen && editingPost && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  onClick={() => setIsEditPostModalOpen(false)}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Edit Post
                  </h3>
                  
                  <form onSubmit={handleUpdatePost} className="mt-4">
                    <div className="mb-4">
                      <label htmlFor="editPostTitle" className="block text-sm font-medium text-gray-700 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        id="editPostTitle"
                        value={editingPost.title}
                        onChange={(e) => setEditingPost({...editingPost, title: e.target.value})}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="editPostContent" className="block text-sm font-medium text-gray-700 mb-1">
                        Content
                      </label>
                      <textarea
                        id="editPostContent"
                        value={editingPost.content}
                        onChange={(e) => setEditingPost({...editingPost, content: e.target.value})}
                        rows={6}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        required
                      ></textarea>
                    </div>
                    
                    {/* Show existing media */}
                    {editingPost.media_url && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Media
                        </label>
                        {editingPost.media_type === 'image' || editingPost.media_url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                          <img 
                            src={editingPost.media_url} 
                            alt="Post image" 
                            className="max-h-64 rounded-lg border border-gray-200"
                          />
                        ) : (
                          <video 
                            src={editingPost.media_url} 
                            controls 
                            className="max-h-64 rounded-lg border border-gray-200"
                          />
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          Note: Media cannot be changed after post creation.
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse">
                      <Button type="submit" className="sm:ml-3">
                        Update Post
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditPostModalOpen(false)}
                        className="mt-3 sm:mt-0"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Community Management Tips</h2>
        <div className="flex items-start space-x-2 text-gray-700">
          <Clock className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">
              Regular Content Schedule
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Post regularly to keep your community engaged. Try to share updates, announcements, or discussion topics at least 2-3 times per week.
            </p>
          </div>
        </div>
        
        <div className="mt-4 flex items-start space-x-2 text-gray-700">
          <Camera className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">
              Rich Media Content
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Posts with images and videos tend to get higher engagement. Incorporate media in your posts when possible to increase visibility and interaction.
            </p>
          </div>
        </div>
        
        <div className="mt-4 flex items-start space-x-2 text-gray-700">
          <MessageCircle className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">
              Engage With Your Community
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Respond to comments promptly and encourage discussions. The more you engage, the more likely your members are to stay active and involved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};