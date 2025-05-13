import React, { useState } from 'react';
import {
  Layers,
  Video,
  Clock,
  Lock,
  ChevronRight,
  ChevronDown,
  FileText,
  Music,
  Globe,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface MediaContent {
  id: string;
  type: 'video' | 'audio' | 'pdf' | 'doc' | 'image' | 'iframe';
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  title?: string;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  mediaContent?: MediaContent;
  duration: number;
  isPreviewable?: boolean;
}

interface Module {
  id: string;
  title: string;
  description?: string;
  lessons: Lesson[];
}

interface CoursePreviewProps {
  modules: Module[];
  isEnrolled?: boolean;
}

export const CoursePreview: React.FC<CoursePreviewProps> = ({ modules, isEnrolled = false }) => {
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [activeLesson, setActiveLesson] = useState<{ moduleId: string; lessonId: string } | null>(null);
  
  // Toggle a module's expanded state
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };
  
  // Calculate total duration of the course
  const getTotalDuration = () => {
    return modules.reduce((total, module) => 
      total + module.lessons.reduce((sum, lesson) => 
        sum + (lesson.duration || 0), 0), 0);
  };
  
  // Count total lessons
  const getTotalLessons = () => {
    return modules.reduce((total, module) => total + module.lessons.length, 0);
  };

  // Handle lesson click
  const handleLessonClick = (moduleId: string, lessonId: string, isPreviewable: boolean | undefined) => {
    if (isEnrolled || isPreviewable) {
      setActiveLesson({ moduleId, lessonId });
    }
  };

  // Get active lesson content
  const getActiveLesson = () => {
    if (!activeLesson) return null;
    
    const module = modules.find(m => m.id === activeLesson.moduleId);
    if (!module) return null;
    
    const lesson = module.lessons.find(l => l.id === activeLesson.lessonId);
    if (!lesson) return null;
    
    return { module, lesson };
  };

  // Render media content
  const renderMediaContent = (mediaContent: MediaContent) => {
    switch (mediaContent.type) {
      case 'video':
        return (
          <video 
            src={mediaContent.url} 
            controls 
            className="w-full h-full"
            poster={mediaContent.thumbnailUrl}
          />
        );
      case 'audio':
        return (
          <div className="h-full flex items-center justify-center bg-gray-100 p-6">
            <div className="w-full max-w-xl">
              <audio src={mediaContent.url} controls className="w-full" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">{mediaContent.title}</h3>
            </div>
          </div>
        );
      case 'pdf':
        return (
          <iframe 
            src={mediaContent.url} 
            title={mediaContent.title || 'PDF document'} 
            className="w-full h-full border-0"
          />
        );
      case 'iframe':
        return (
          <iframe 
            src={mediaContent.url} 
            title={mediaContent.title || 'Embedded content'} 
            className="w-full h-full border-0"
            allowFullScreen
          />
        );
      default:
        return (
          <div className="h-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-2 text-gray-700">This content type cannot be previewed</p>
            </div>
          </div>
        );
    }
  };

  // Generate lesson icon based on media type
  const getLessonIcon = (lesson: Lesson) => {
    if (!lesson.mediaContent) return <Video className="h-4 w-4 text-gray-400" />;
    
    switch (lesson.mediaContent.type) {
      case 'video': return <Video className="h-4 w-4 text-purple-600" />;
      case 'audio': return <Music className="h-4 w-4 text-green-600" />;
      case 'pdf': return <FileText className="h-4 w-4 text-red-600" />;
      case 'doc': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'iframe': return <Globe className="h-4 w-4 text-cyan-600" />;
      default: return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const activeContent = getActiveLesson();
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="lg:grid lg:grid-cols-3 lg:gap-0">
        {/* Course curriculum sidebar */}
        <div className="lg:col-span-1 border-r border-gray-200">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium text-gray-900">Course Curriculum</h2>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <Layers className="mr-1.5 h-4 w-4 text-gray-400" />
              <span>{modules.length} modules</span>
              <span className="mx-2">•</span>
              <Video className="mr-1.5 h-4 w-4 text-gray-400" />
              <span>{getTotalLessons()} lessons</span>
              <span className="mx-2">•</span>
              <Clock className="mr-1.5 h-4 w-4 text-gray-400" />
              <span>{getTotalDuration()} min total</span>
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-[600px]">
            {modules.map((module) => (
              <div key={module.id} className="border-b border-gray-200">
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none"
                  onClick={() => toggleModule(module.id)}
                >
                  <div className="flex items-center">
                    <Layers className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="font-medium text-gray-900">{module.title}</span>
                  </div>
                  {expandedModules[module.id] ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                
                {expandedModules[module.id] && (
                  <div className="pb-2">
                    {module.lessons.map((lesson) => {
                      const isActive = activeLesson?.lessonId === lesson.id;
                      const canAccess = isEnrolled || lesson.isPreviewable;
                      
                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          className={`w-full pl-10 pr-4 py-2 text-left flex items-center justify-between text-sm 
                            ${canAccess ? 'hover:bg-gray-50 focus:outline-none' : 'opacity-75'} 
                            ${isActive ? 'bg-purple-50' : ''}`}
                          onClick={() => handleLessonClick(module.id, lesson.id, lesson.isPreviewable)}
                        >
                          <div className="flex-1 flex items-center">
                            {getLessonIcon(lesson)}
                            <span className={`ml-2 ${isActive ? 'text-purple-700 font-medium' : 'text-gray-700'}`}>{lesson.title}</span>
                            {lesson.isPreviewable && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                                Preview
                              </span>
                            )}
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 mr-2">{lesson.duration} min</span>
                            {!canAccess && <Lock className="h-3.5 w-3.5 text-gray-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Content display area */}
        <div className="lg:col-span-2">
          {activeContent ? (
            <div className="h-full flex flex-col">
              <div className="aspect-w-16 aspect-h-9 bg-gray-900 h-[340px]">
                {activeContent.lesson.mediaContent ? (
                  renderMediaContent(activeContent.lesson.mediaContent)
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-white">
                      <Video className="h-16 w-16 mx-auto text-gray-400" />
                      <p className="mt-2 text-lg">No media content available</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 flex-1">
                <h2 className="text-xl font-semibold text-gray-900">{activeContent.lesson.title}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  From module: {activeContent.module.title}
                </p>
                
                {activeContent.lesson.description && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-900">Lesson Description</h3>
                    <p className="mt-1 text-gray-700">{activeContent.lesson.description}</p>
                  </div>
                )}
                
                {!isEnrolled && !activeContent.lesson.isPreviewable && (
                  <div className="mt-6 bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                    <p className="text-yellow-800">
                      This is a preview of the course content. Enroll to access all lessons.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-6 bg-gray-50">
              <div className="text-center max-w-md mx-auto">
                <Video className="h-12 w-12 text-gray-400 mx-auto" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">Select a lesson to start learning</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose a lesson from the curriculum to view its content.
                </p>
                {!isEnrolled && (
                  <div className="mt-6">
                    <Button>Enroll in This Course</Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};