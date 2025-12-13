import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ReactPlayer from 'react-player';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronLeft, ChevronRight, CheckCircle2, Play, FileText, 
  HelpCircle, Award, Lock, Check
} from 'lucide-react';
import { cn } from "@/lib/utils";

const moduleIcons = {
  video: Play,
  reading: FileText,
  quiz: HelpCircle
};

export default function CourseViewer() {
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState(null);
  const [course, setCourse] = useState(null);
  const [moduleProgress, setModuleProgress] = useState([]);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoPlayed, setVideoPlayed] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [maxWatchedTime, setMaxWatchedTime] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  
  const playerRef = useRef(null);
  const readingRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (currentModule?.type === 'reading') {
      const handleScroll = () => {
        const element = readingRef.current;
        if (!element) return;
        
        const scrollPercentage = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
        setReadingProgress(Math.min(scrollPercentage, 100));
        
        if (scrollPercentage > 90) {
          handleModuleComplete();
        }
      };
      
      const element = readingRef.current;
      element?.addEventListener('scroll', handleScroll);
      return () => element?.removeEventListener('scroll', handleScroll);
    }
  }, [currentModuleIndex]);

  const loadData = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const assignmentId = params.get('assignmentId');
      
      if (!assignmentId) {
        navigate(createPageUrl('EmployeeTraining'));
        return;
      }

      const assignments = await base44.entities.CourseAssignment.filter({ id: assignmentId });
      if (assignments.length === 0) {
        navigate(createPageUrl('EmployeeTraining'));
        return;
      }

      const assignmentData = assignments[0];
      setAssignment(assignmentData);

      const courses = await base44.entities.Course.filter({ id: assignmentData.course_id });
      if (courses.length > 0) {
        setCourse(courses[0]);
      }

      const progress = await base44.entities.ModuleProgress.filter({
        assignment_id: assignmentId
      });
      setModuleProgress(progress);

      if (assignmentData.status === 'not_started') {
        await base44.entities.CourseAssignment.update(assignmentId, {
          status: 'in_progress'
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentModule = course?.modules?.[currentModuleIndex];
  const currentProgress = moduleProgress.find(p => p.module_id === currentModule?.id);

  const handleVideoProgress = (state) => {
    const played = state.played * 100;
    const playedSeconds = state.playedSeconds;
    
    // Prevent seeking forward beyond max watched time
    if (playedSeconds > maxWatchedTime + 2 && maxWatchedTime > 0) {
      if (playerRef.current) {
        playerRef.current.seekTo(maxWatchedTime);
      }
      return;
    }
    
    setVideoPlayed(playedSeconds);
    setVideoProgress(played);
    
    // Update max watched time
    if (playedSeconds > maxWatchedTime) {
      setMaxWatchedTime(playedSeconds);
    }
    
    // User must watch at least 95% of the video
    if (played >= 95 && !currentProgress?.completed) {
      handleModuleComplete();
    }
  };

  const handleVideoDuration = (duration) => {
    setVideoDuration(duration);
  };

  const handleModuleComplete = async () => {
    if (currentProgress?.completed) return;

    try {
      if (currentProgress) {
        await base44.entities.ModuleProgress.update(currentProgress.id, {
          completed: true,
          progress_percentage: 100,
          completed_date: new Date().toISOString()
        });
      } else {
        await base44.entities.ModuleProgress.create({
          employee_id: assignment.employee_id,
          course_id: assignment.course_id,
          assignment_id: assignment.id,
          module_id: currentModule.id,
          module_type: currentModule.type,
          completed: true,
          progress_percentage: 100,
          completed_date: new Date().toISOString()
        });
      }

      await updateCourseProgress();
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleQuizSubmit = async () => {
    const quiz = currentModule.quiz;
    let correctCount = 0;
    
    quiz.questions.forEach((q, index) => {
      if (quizAnswers[index] === q.correct_answer) {
        correctCount++;
      }
    });
    
    const score = (correctCount / quiz.questions.length) * 100;
    const passed = score >= quiz.passing_score;
    
    setQuizResult({ score, passed, correctCount });
    setQuizSubmitted(true);

    try {
      if (currentProgress) {
        await base44.entities.ModuleProgress.update(currentProgress.id, {
          quiz_score: score,
          quiz_passed: passed,
          quiz_attempts: (currentProgress.quiz_attempts || 0) + 1,
          completed: passed,
          completed_date: passed ? new Date().toISOString() : null
        });
      } else {
        await base44.entities.ModuleProgress.create({
          employee_id: assignment.employee_id,
          course_id: assignment.course_id,
          assignment_id: assignment.id,
          module_id: currentModule.id,
          module_type: 'quiz',
          quiz_score: score,
          quiz_passed: passed,
          quiz_attempts: 1,
          completed: passed,
          completed_date: passed ? new Date().toISOString() : null
        });
      }

      if (passed) {
        await updateCourseProgress();
      }
      
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const updateCourseProgress = async () => {
    const completedModules = moduleProgress.filter(p => p.completed).length + 1;
    const totalModules = course.modules.length;
    const progressPercentage = Math.round((completedModules / totalModules) * 100);

    const updates = {
      progress_percentage: progressPercentage,
      current_module_id: currentModule.id
    };

    if (progressPercentage >= 100) {
      updates.status = 'completed';
      updates.completed_date = new Date().toISOString();
      
      // Generate certificate if enabled
      if (course.certificate_enabled && course.certificate_file_url) {
        updates.certificate_url = course.certificate_file_url;
      }
    }

    await base44.entities.CourseAssignment.update(assignment.id, updates);
  };

  const canAccessModule = (index) => {
    if (index === 0) return true;
    const previousModule = course.modules[index - 1];
    const previousProgress = moduleProgress.find(p => p.module_id === previousModule.id);
    return previousProgress?.completed;
  };

  const goToNextModule = () => {
    if (currentModuleIndex < course.modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizResult(null);
      setMaxWatchedTime(0);
      setVideoProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!course || !currentModule) {
    return (
      <div className="p-6 lg:p-8">
        <div className="text-center py-16">
          <p className="text-slate-500">Course not found</p>
          <Button onClick={() => navigate(createPageUrl('EmployeeTraining'))} className="mt-4">
            Back to Training
          </Button>
        </div>
      </div>
    );
  }

  const Icon = moduleIcons[currentModule.type] || FileText;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(createPageUrl('EmployeeTraining'))}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="font-semibold text-slate-800">{course.title}</h1>
                <p className="text-sm text-slate-500">
                  Module {currentModuleIndex + 1} of {course.modules.length}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Progress value={assignment.progress_percentage || 0} className="w-32" />
              <span className="text-sm font-medium">{assignment.progress_percentage || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Module List */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Course Modules</h3>
                <div className="space-y-2">
                  {course.modules.map((module, index) => {
                    const ModIcon = moduleIcons[module.type] || FileText;
                    const progress = moduleProgress.find(p => p.module_id === module.id);
                    const isLocked = !canAccessModule(index);
                    const isCurrent = index === currentModuleIndex;
                    
                    return (
                      <button
                        key={module.id}
                        onClick={() => !isLocked && setCurrentModuleIndex(index)}
                        disabled={isLocked}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-colors",
                          isCurrent ? "bg-emerald-50 border-2 border-emerald-500" :
                          isLocked ? "bg-slate-50 opacity-50 cursor-not-allowed" :
                          "bg-slate-50 hover:bg-slate-100"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                            progress?.completed ? "bg-emerald-100" : "bg-slate-200"
                          )}>
                            {progress?.completed ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            ) : isLocked ? (
                              <Lock className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ModIcon className="h-4 w-4 text-slate-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{module.title}</p>
                            <p className="text-xs text-slate-500 capitalize">{module.type}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-800">{currentModule.title}</h2>
                    <p className="text-sm text-slate-500 capitalize">{currentModule.type} Module</p>
                  </div>
                </div>

                {/* Video Module */}
                {currentModule.type === 'video' && (
                  <div>
                    <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                      <div className="absolute inset-0 bg-slate-900 rounded-lg overflow-hidden">
                        <ReactPlayer
                          ref={playerRef}
                          url={currentModule.video_url}
                          controls={true}
                          width="100%"
                          height="100%"
                          onProgress={handleVideoProgress}
                          onDuration={handleVideoDuration}
                          progressInterval={100}
                          config={{
                            youtube: {
                              playerVars: { 
                                modestbranding: 1,
                                rel: 0
                              }
                            },
                            file: {
                              attributes: {
                                controlsList: 'nodownload'
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                    {!currentProgress?.completed && (
                      <div className="mt-4">
                        <Progress value={videoProgress} className="h-2" />
                        <p className="text-sm text-slate-500 mt-2">
                          Watch at least 95% of the video to continue ({Math.round(videoProgress)}% watched)
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Reading Module */}
                {currentModule.type === 'reading' && (
                  <div>
                    {currentModule.reading_url ? (
                      <iframe
                        src={currentModule.reading_url}
                        className="w-full h-[600px] rounded-lg border"
                      />
                    ) : (
                      <div
                        ref={readingRef}
                        className="prose max-w-none h-[600px] overflow-y-auto p-6 bg-slate-50 rounded-lg"
                      >
                        <div dangerouslySetInnerHTML={{ __html: currentModule.reading_content }} />
                      </div>
                    )}
                    {!currentProgress?.completed && (
                      <div className="mt-4">
                        <Progress value={readingProgress} className="h-2" />
                        <p className="text-sm text-slate-500 mt-2">Scroll to the bottom to continue</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Quiz Module */}
                {currentModule.type === 'quiz' && (
                  <div className="space-y-6">
                    {!quizSubmitted ? (
                      <>
                        <div className="bg-blue-50 rounded-lg p-4">
                          <p className="text-sm text-blue-800">
                            Passing score: {currentModule.quiz.passing_score}%
                          </p>
                        </div>
                        {currentModule.quiz.questions.map((question, qIndex) => (
                          <div key={qIndex} className="p-4 bg-slate-50 rounded-lg">
                            <p className="font-medium mb-4">
                              {qIndex + 1}. {question.question}
                            </p>
                            <RadioGroup
                              value={quizAnswers[qIndex]?.toString()}
                              onValueChange={(value) => setQuizAnswers({ ...quizAnswers, [qIndex]: parseInt(value) })}
                            >
                              {question.options.map((option, oIndex) => (
                                <div key={oIndex} className="flex items-center space-x-2 mb-2">
                                  <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                                  <Label htmlFor={`q${qIndex}-o${oIndex}`} className="cursor-pointer">
                                    {option}
                                  </Label>
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        ))}
                        <Button
                          onClick={handleQuizSubmit}
                          disabled={Object.keys(quizAnswers).length < currentModule.quiz.questions.length}
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
                        >
                          Submit Quiz
                        </Button>
                      </>
                    ) : (
                      <div>
                        <div className={cn(
                          "p-6 rounded-lg mb-6",
                          quizResult.passed ? "bg-emerald-50" : "bg-red-50"
                        )}>
                          <div className="flex items-center gap-3 mb-2">
                            {quizResult.passed ? (
                              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                            ) : (
                              <HelpCircle className="h-8 w-8 text-red-600" />
                            )}
                            <div>
                              <h3 className={cn(
                                "text-xl font-semibold",
                                quizResult.passed ? "text-emerald-800" : "text-red-800"
                              )}>
                                {quizResult.passed ? 'Congratulations!' : 'Not Quite'}
                              </h3>
                              <p className={cn(
                                "text-sm",
                                quizResult.passed ? "text-emerald-700" : "text-red-700"
                              )}>
                                Score: {quizResult.score.toFixed(0)}% ({quizResult.correctCount}/{currentModule.quiz.questions.length} correct)
                              </p>
                            </div>
                          </div>
                        </div>

                        {currentModule.quiz.questions.map((question, qIndex) => {
                          const isCorrect = quizAnswers[qIndex] === question.correct_answer;
                          return (
                            <div key={qIndex} className={cn(
                              "p-4 rounded-lg mb-4",
                              isCorrect ? "bg-emerald-50" : "bg-red-50"
                            )}>
                              <p className="font-medium mb-2">
                                {qIndex + 1}. {question.question}
                              </p>
                              <div className="space-y-2">
                                {question.options.map((option, oIndex) => {
                                  const isSelected = quizAnswers[qIndex] === oIndex;
                                  const isCorrectAnswer = oIndex === question.correct_answer;
                                  
                                  return (
                                    <div
                                      key={oIndex}
                                      className={cn(
                                        "p-2 rounded flex items-center gap-2",
                                        isCorrectAnswer && "bg-emerald-100",
                                        isSelected && !isCorrect && "bg-red-100"
                                      )}
                                    >
                                      {isCorrectAnswer && <Check className="h-4 w-4 text-emerald-600" />}
                                      <span>{option}</span>
                                    </div>
                                  );
                                })}
                              </div>
                              {question.explanation && (
                                <p className="text-sm text-slate-600 mt-2 italic">
                                  {question.explanation}
                                </p>
                              )}
                            </div>
                          );
                        })}

                        {!quizResult.passed && (
                          <Button
                            onClick={() => {
                              setQuizSubmitted(false);
                              setQuizAnswers({});
                              setQuizResult(null);
                            }}
                            className="w-full"
                          >
                            Retry Quiz
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation */}
                {currentProgress?.completed && (
                  <div className="mt-6 pt-6 border-t flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentModuleIndex(Math.max(0, currentModuleIndex - 1))}
                      disabled={currentModuleIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                    </Button>
                    {currentModuleIndex < course.modules.length - 1 ? (
                      <Button
                        onClick={goToNextModule}
                        disabled={!canAccessModule(currentModuleIndex + 1)}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Next Module <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        onClick={() => navigate(createPageUrl('EmployeeTraining'))}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Award className="h-4 w-4 mr-2" /> Complete Course
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}