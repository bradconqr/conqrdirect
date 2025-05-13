import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Grip, 
  Clock, 
  Video, 
  File,
  Music,
  FileText,
  Globe
} from 'lucide-react';
import { Button } from '../ui/Button';
import { ResourceUploader } from './ResourceUploader';
import { MediaUploader } from './MediaUploader';
import { Card, CardContent } from '../ui/Card';

interface Resource {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: number;
}

interface MediaContent {
  id: string;
  type: 'video' | 'audio' | 'pdf' | 'doc' | 'image' | 'iframe';
  url: string;
  thumbnailUrl?: string;
  duration?: number;
  title?: string;
  size?: number;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  mediaContent?: MediaContent;
  duration: number;
  resources: Resource[];
  isPublished?: boolean;
  isPreviewable?: boolean;
  sortOrder?: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  isPublished?: boolean;
  sortOrder?: number;
}

interface CourseModuleEditorProps {
  modules: Module[];
  onChange: (modules: Module[]) => void;
}

export const CourseModuleEditor: React.FC<CourseModuleEditorProps> = ({
  modules,
  onChange
}) => {
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});
  const [moduleBeingDragged, setModuleBeingDragged] = useState<string | null>(null);
  const [lessonBeingDragged, setLessonBeingDragged] = useState<{moduleId: string; lessonId: string} | null>(null);
  
  // Generate a unique ID
  const generateId = () => `id_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  
  // Toggle expanded state for a module
  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };
  
  // Toggle expanded state for a lesson
  const toggleLesson = (lessonId: string) => {
    setExpandedLessons(prev => ({
      ...prev,
      [lessonId]: !prev[lessonId]
    }));
  };
  
  // Add a new module
  const addModule = () => {
    const newModule: Module = {
      id: generateId(),
      title: `Module ${modules.length + 1}`,
      description: '',
      lessons: [],
      isPublished: false,
      sortOrder: modules.length
    };
    
    const newModules = [...modules, newModule];
    onChange(newModules);
    
    // Auto-expand the new module
    setExpandedModules(prev => ({
      ...prev,
      [newModule.id]: true
    }));
  };
  
  // Add a lesson to a module
  const addLesson = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;
    
    const newLesson: Lesson = {
      id: generateId(),
      title: `Lesson ${module.lessons.length + 1}`,
      description: '',
      duration: 0,
      resources: [],
      isPublished: false,
      isPreviewable: false,
      sortOrder: module.lessons.length
    };
    
    const newModules = modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          lessons: [...module.lessons, newLesson]
        };
      }
      return module;
    });
    
    onChange(newModules);
    
    // Auto-expand the new lesson
    setExpandedLessons(prev => ({
      ...prev,
      [newLesson.id]: true
    }));
  };
  
  // Update a module
  const updateModule = (moduleId: string, updates: Partial<Module>) => {
    const newModules = modules.map(module => {
      if (module.id === moduleId) {
        return { ...module, ...updates };
      }
      return module;
    });
    
    onChange(newModules);
  };
  
  // Update a lesson
  const updateLesson = (moduleId: string, lessonId: string, updates: Partial<Lesson>) => {
    const newModules = modules.map(module => {
      if (module.id === moduleId) {
        const updatedLessons = module.lessons.map(lesson => {
          if (lesson.id === lessonId) {
            return { ...lesson, ...updates };
          }
          return lesson;
        });
        
        return { ...module, lessons: updatedLessons };
      }
      return module;
    });
    
    onChange(newModules);
  };
  
  // Remove a module
  const removeModule = (moduleId: string) => {
    const newModules = modules.filter(module => module.id !== moduleId);
    onChange(newModules);
  };
  
  // Remove a lesson
  const removeLesson = (moduleId: string, lessonId: string) => {
    const newModules = modules.map(module => {
      if (module.id === moduleId) {
        return {
          ...module,
          lessons: module.lessons.filter(lesson => lesson.id !== lessonId)
        };
      }
      return module;
    });
    
    onChange(newModules);
  };
  
  // Add a resource to a lesson
  const addResource = (moduleId: string, lessonId: string, resource: Resource) => {
    const newModules = modules.map(module => {
      if (module.id === moduleId) {
        const updatedLessons = module.lessons.map(lesson => {
          if (lesson.id === lessonId) {
            return { 
              ...lesson, 
              resources: [...lesson.resources, resource] 
            };
          }
          return lesson;
        });
        
        return { ...module, lessons: updatedLessons };
      }
      return module;
    });
    
    onChange(newModules);
  };
  
  // Remove a resource
  const removeResource = (moduleId: string, lessonId: string, resourceId: string) => {
    const newModules = modules.map(module => {
      if (module.id === moduleId) {
        const updatedLessons = module.lessons.map(lesson => {
          if (lesson.id === lessonId) {
            return { 
              ...lesson, 
              resources: lesson.resources.filter(r => r.id !== resourceId)
            };
          }
          return lesson;
        });
        
        return { ...module, lessons: updatedLessons };
      }
      return module;
    });
    
    onChange(newModules);
  };
  
  // Move module up
  const moveModuleUp = (index: number) => {
    if (index === 0) return;
    const newModules = [...modules];
    [newModules[index - 1], newModules[index]] = [newModules[index], newModules[index - 1]];
    
    // Update sort order to match new positions
    newModules.forEach((module, idx) => {
      module.sortOrder = idx;
    });
    
    onChange(newModules);
  };
  
  // Move module down
  const moveModuleDown = (index: number) => {
    if (index === modules.length - 1) return;
    const newModules = [...modules];
    [newModules[index], newModules[index + 1]] = [newModules[index + 1], newModules[index]];
    
    // Update sort order to match new positions
    newModules.forEach((module, idx) => {
      module.sortOrder = idx;
    });
    
    onChange(newModules);
  };
  
  // Move lesson up
  const moveLessonUp = (moduleId: string, index: number) => {
    if (index === 0) return;
    const newModules = modules.map(module => {
      if (module.id === moduleId) {
        const newLessons = [...module.lessons];
        [newLessons[index - 1], newLessons[index]] = [newLessons[index], newLessons[index - 1]];
        
        // Update sort order to match new positions
        newLessons.forEach((lesson, idx) => {
          lesson.sortOrder = idx;
        });
        
        return { ...module, lessons: newLessons };
      }
      return module;
    });
    
    onChange(newModules);
  };
  
  // Move lesson down
  const moveLessonDown = (moduleId: string, index: number) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module || index === module.lessons.length - 1) return;
    
    const newModules = modules.map(module => {
      if (module.id === moduleId) {
        const newLessons = [...module.lessons];
        [newLessons[index], newLessons[index + 1]] = [newLessons[index + 1], newLessons[index]];
        
        // Update sort order to match new positions
        newLessons.forEach((lesson, idx) => {
          lesson.sortOrder = idx;
        });
        
        return { ...module, lessons: newLessons };
      }
      return module;
    });
    
    onChange(newModules);
  };

  const handleMediaUpload = (moduleId: string, lessonId: string, file: File, type: 'video' | 'audio' | 'pdf' | 'doc' | 'image' | 'iframe') => {
    // In a real implementation, you would upload the file here
    // For this example, we'll simulate updating the mediaContent
    const mediaUrl = URL.createObjectURL(file);
    
    let duration = 0;
    if (type === 'video' || type === 'audio') {
      // In a real implementation, you would extract duration from the media file
      // For simplicity, we'll use a placeholder value
      duration = Math.floor(Math.random() * 30) + 5; // 5-35 minutes
    }
    
    const mediaContent: MediaContent = {
      id: generateId(),
      type,
      url: mediaUrl,
      title: file.name,
      size: file.size,
      duration: type === 'video' || type === 'audio' ? duration : undefined
    };
    
    updateLesson(moduleId, lessonId, { 
      mediaContent,
      duration: type === 'video' || type === 'audio' ? duration : 0
    });
  };
  
  const handleIframeUrlSubmit = (moduleId: string, lessonId: string, url: string) => {
    const mediaContent: MediaContent = {
      id: generateId(),
      type: 'iframe',
      url: url,
      title: 'Embedded Content'
    };
    
    updateLesson(moduleId, lessonId, { 
      mediaContent
    });
  };
  
  const clearMediaContent = (moduleId: string, lessonId: string) => {
    updateLesson(moduleId, lessonId, { 
      mediaContent: undefined,
      duration: 0
    });
  };

  const toggleLessonPublished = (moduleId: string, lessonId: string, currentState: boolean | undefined) => {
    updateLesson(moduleId, lessonId, { isPublished: !currentState });
  };

  const toggleLessonPreview = (moduleId: string, lessonId: string, currentState: boolean | undefined) => {
    updateLesson(moduleId, lessonId, { isPreviewable: !currentState });
  };

  const toggleModulePublished = (moduleId: string, currentState: boolean | undefined) => {
    updateModule(moduleId, { isPublished: !currentState });
  };

  // Handle drag-and-drop for modules
  const handleModuleDragStart = (moduleId: string) => {
    setModuleBeingDragged(moduleId);
  };

  const handleModuleDragOver = (e: React.DragEvent, moduleId: string) => {
    e.preventDefault();
    if (!moduleBeingDragged || moduleBeingDragged === moduleId) return;
    
    const draggedIndex = modules.findIndex(m => m.id === moduleBeingDragged);
    const targetIndex = modules.findIndex(m => m.id === moduleId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newModules = [...modules];
    const [removedModule] = newModules.splice(draggedIndex, 1);
    newModules.splice(targetIndex, 0, removedModule);
    
    // Update sort order
    newModules.forEach((module, idx) => {
      module.sortOrder = idx;
    });
    
    onChange(newModules);
  };

  const handleModuleDragEnd = () => {
    setModuleBeingDragged(null);
  };

  // Handle drag-and-drop for lessons
  const handleLessonDragStart = (moduleId: string, lessonId: string) => {
    setLessonBeingDragged({ moduleId, lessonId });
  };

  const handleLessonDragOver = (e: React.DragEvent, moduleId: string, lessonId: string) => {
    e.preventDefault();
    if (!lessonBeingDragged || 
        (lessonBeingDragged.moduleId === moduleId && lessonBeingDragged.lessonId === lessonId)) return;
    
    const sourceModule = modules.find(m => m.id === lessonBeingDragged.moduleId);
    const targetModule = modules.find(m => m.id === moduleId);
    
    if (!sourceModule || !targetModule) return;
    
    const draggedLessonIndex = sourceModule.lessons.findIndex(l => l.id === lessonBeingDragged.lessonId);
    const targetLessonIndex = targetModule.lessons.findIndex(l => l.id === lessonId);
    
    if (draggedLessonIndex === -1 || targetLessonIndex === -1) return;
    
    const newModules = [...modules];
    const sourceModuleIndex = newModules.findIndex(m => m.id === lessonBeingDragged.moduleId);
    const targetModuleIndex = newModules.findIndex(m => m.id === moduleId);
    
    // Remove lesson from source module
    const [removedLesson] = newModules[sourceModuleIndex].lessons.splice(draggedLessonIndex, 1);
    
    // Add lesson to target module
    newModules[targetModuleIndex].lessons.splice(targetLessonIndex, 0, removedLesson);
    
    // Update sort order for both modules
    newModules[sourceModuleIndex].lessons.forEach((lesson, idx) => {
      lesson.sortOrder = idx;
    });
    
    newModules[targetModuleIndex].lessons.forEach((lesson, idx) => {
      lesson.sortOrder = idx;
    });
    
    onChange(newModules);
  };

  const handleLessonDragEnd = () => {
    setLessonBeingDragged(null);
  };

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4 text-purple-600" />;
      case 'audio': return <Music className="h-4 w-4 text-green-600" />;
      case 'pdf': return <FileText className="h-4 w-4 text-red-600" />;
      case 'doc': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'iframe': return <Globe className="h-4 w-4 text-cyan-600" />;
      default: return <File className="h-4 w-4 text-gray-600" />;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-medium text-gray-900">Course Content</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={addModule}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Add Module
        </Button>
      </div>
      
      {modules.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Layers className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="mt-2 text-sm font-medium text-gray-700">No modules added yet</p>
            <p className="mt-1 text-sm text-gray-500">Organize your course content into modules and lessons</p>
            <Button 
              className="mt-4" 
              onClick={addModule}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add First Module
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {modules.map((module, moduleIndex) => (
            <div 
              key={module.id} 
              className={`border rounded-md ${moduleBeingDragged === module.id ? 'border-purple-500 opacity-70' : ''}`}
              draggable
              onDragStart={() => handleModuleDragStart(module.id)}
              onDragOver={(e) => handleModuleDragOver(e, module.id)}
              onDragEnd={handleModuleDragEnd}
            >
              {/* Module header */}
              <div className="flex items-center p-4 border-b bg-gray-50">
                <Grip className="h-5 w-5 text-gray-400 mr-2 cursor-move" />
                
                <div className="flex-1">
                  <button
                    type="button"
                    className="flex items-center w-full text-left font-medium text-gray-900"
                    onClick={() => toggleModule(module.id)}
                  >
                    <Layers className="h-5 w-5 text-purple-500 mr-2" />
                    <span>{module.title}</span>
                    {expandedModules[module.id] ? (
                      <ChevronUp className="h-4 w-4 ml-2" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-2" />
                    )}
                  </button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex mr-2 items-center">
                    <label htmlFor={`module-published-${module.id}`} className="mr-2 text-xs text-gray-500">
                      Published
                    </label>
                    <input
                      type="checkbox"
                      id={`module-published-${module.id}`}
                      checked={!!module.isPublished}
                      onChange={() => toggleModulePublished(module.id, module.isPublished)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => moveModuleUp(moduleIndex)}
                    disabled={moduleIndex === 0}
                    className={`p-1 rounded-md ${
                      moduleIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => moveModuleDown(moduleIndex)}
                    disabled={moduleIndex === modules.length - 1}
                    className={`p-1 rounded-md ${
                      moduleIndex === modules.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => removeModule(module.id)}
                    className="p-1 rounded-md text-red-500 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Module content */}
              {expandedModules[module.id] && (
                <div className="p-4 space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label htmlFor={`module-title-${module.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                        Module Title
                      </label>
                      <input
                        type="text"
                        id={`module-title-${module.id}`}
                        value={module.title}
                        onChange={(e) => updateModule(module.id, { title: e.target.value })}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor={`module-description-${module.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                        Module Description
                      </label>
                      <textarea
                        id={`module-description-${module.id}`}
                        value={module.description}
                        onChange={(e) => updateModule(module.id, { description: e.target.value })}
                        rows={2}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* Lessons */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-gray-700">Lessons</h4>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => addLesson(module.id)}
                        leftIcon={<Plus className="h-4 w-4" />}
                      >
                        Add Lesson
                      </Button>
                    </div>
                    
                    {module.lessons.length === 0 ? (
                      <div className="border border-dashed rounded-md p-4 text-center">
                        <Video className="h-6 w-6 mx-auto text-gray-400" />
                        <p className="mt-1 text-sm text-gray-500">No lessons added yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <div 
                            key={lesson.id} 
                            className={`border rounded-md ${
                              lessonBeingDragged && lessonBeingDragged.lessonId === lesson.id ? 
                              'border-purple-500 opacity-70' : ''
                            }`}
                            draggable
                            onDragStart={() => handleLessonDragStart(module.id, lesson.id)}
                            onDragOver={(e) => handleLessonDragOver(e, module.id, lesson.id)}
                            onDragEnd={handleLessonDragEnd}
                          >
                            {/* Lesson header */}
                            <div className="flex items-center p-3 border-b bg-gray-50">
                              <Grip className="h-4 w-4 text-gray-400 mr-2 cursor-move" />
                              
                              <div className="flex-1">
                                <button
                                  type="button"
                                  className="flex items-center w-full text-left font-medium text-gray-900"
                                  onClick={() => toggleLesson(lesson.id)}
                                >
                                  {lesson.mediaContent ? (
                                    getMediaTypeIcon(lesson.mediaContent.type)
                                  ) : (
                                    <Video className="h-4 w-4 text-teal-500 mr-2" />
                                  )}
                                  <span className="ml-2">{lesson.title}</span>
                                  {expandedLessons[lesson.id] ? (
                                    <ChevronUp className="h-3 w-3 ml-2" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3 ml-2" />
                                  )}
                                </button>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-gray-500 mr-1 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {lesson.duration > 0 ? `${lesson.duration} min` : 'No duration'}
                                </span>
                                
                                <button
                                  type="button"
                                  onClick={() => moveLessonUp(module.id, lessonIndex)}
                                  disabled={lessonIndex === 0}
                                  className={`p-1 rounded-md ${
                                    lessonIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'
                                  }`}
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => moveLessonDown(module.id, lessonIndex)}
                                  disabled={lessonIndex === module.lessons.length - 1}
                                  className={`p-1 rounded-md ${
                                    lessonIndex === module.lessons.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'
                                  }`}
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </button>
                                
                                <button
                                  type="button"
                                  onClick={() => removeLesson(module.id, lesson.id)}
                                  className="p-1 rounded-md text-red-500 hover:bg-red-50"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Lesson content */}
                            {expandedLessons[lesson.id] && (
                              <div className="p-3 space-y-4">
                                <div>
                                  <label htmlFor={`lesson-title-${lesson.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                                    Lesson Title
                                  </label>
                                  <input
                                    type="text"
                                    id={`lesson-title-${lesson.id}`}
                                    value={lesson.title}
                                    onChange={(e) => updateLesson(module.id, lesson.id, { title: e.target.value })}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                  />
                                </div>
                                
                                <div>
                                  <label htmlFor={`lesson-description-${lesson.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                                    Lesson Description
                                  </label>
                                  <textarea
                                    id={`lesson-description-${lesson.id}`}
                                    value={lesson.description}
                                    onChange={(e) => updateLesson(module.id, lesson.id, { description: e.target.value })}
                                    rows={2}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                  />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`lesson-published-${lesson.id}`}
                                      checked={!!lesson.isPublished}
                                      onChange={() => toggleLessonPublished(module.id, lesson.id, lesson.isPublished)}
                                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor={`lesson-published-${lesson.id}`} className="ml-2 block text-sm text-gray-700">
                                      Publish this lesson
                                    </label>
                                  </div>
                                  
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`lesson-preview-${lesson.id}`}
                                      checked={!!lesson.isPreviewable}
                                      onChange={() => toggleLessonPreview(module.id, lesson.id, lesson.isPreviewable)}
                                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor={`lesson-preview-${lesson.id}`} className="ml-2 block text-sm text-gray-700">
                                      Allow free preview
                                    </label>
                                  </div>
                                </div>
                                
                                <div>
                                  <label htmlFor={`lesson-duration-${lesson.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                                    Duration (minutes)
                                  </label>
                                  <input
                                    type="number"
                                    id={`lesson-duration-${lesson.id}`}
                                    value={lesson.duration}
                                    onChange={(e) => updateLesson(module.id, lesson.id, { duration: parseInt(e.target.value) || 0 })}
                                    min="0"
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                                  />
                                </div>
                                
                                <div>
                                  <MediaUploader
                                    onFileSelected={(file, type) => handleMediaUpload(module.id, lesson.id, file, type)}
                                    onIframeUrlSubmit={(url) => handleIframeUrlSubmit(module.id, lesson.id, url)}
                                    onClear={() => clearMediaContent(module.id, lesson.id)}
                                    currentFileName={lesson.mediaContent?.title}
                                    currentFileType={lesson.mediaContent?.type}
                                    previewUrl={lesson.mediaContent?.url}
                                    iframeUrl={lesson.mediaContent?.type === 'iframe' ? lesson.mediaContent.url : undefined}
                                  />
                                </div>
                                
                                <div>
                                  <ResourceUploader
                                    resources={lesson.resources}
                                    onAdd={(resource) => addResource(module.id, lesson.id, resource)}
                                    onRemove={(resourceId) => removeResource(module.id, lesson.id, resourceId)}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 bg-yellow-50 border border-yellow-100 rounded-lg p-4">
        <h4 className="text-sm font-medium text-yellow-800 flex items-center mb-2">
          <Clock className="h-4 w-4 mr-2" />
          Course Content Statistics
        </h4>
        <ul className="text-sm text-yellow-700">
          <li>Total Modules: {modules.length}</li>
          <li>Total Lessons: {modules.reduce((count, module) => count + module.lessons.length, 0)}</li>
          <li>Total Duration: {modules.reduce((total, module) => 
            total + module.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0), 0)} minutes
          </li>
          <li>Published Modules: {modules.filter(m => m.isPublished).length}</li>
          <li>Free Preview Lessons: {modules.reduce((count, module) => 
            count + module.lessons.filter(l => l.isPreviewable).length, 0)}
          </li>
        </ul>
      </div>
    </div>
  );
};