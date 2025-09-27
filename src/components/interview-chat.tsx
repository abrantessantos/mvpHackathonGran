import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: number;
  text: string;
  type: "geral" | "tecnica" | "situacional";
  level: "básico" | "intermediário" | "avançado";
}

interface Answer {
  questionId: number;
  text: string;
  feedback: {
    clarity: number;
    structure: number;
    confidence: number;
    examples: number;
    overall: number;
    suggestions: string[];
  };
}

const InterviewChat = () => {
  const [step, setStep] = useState<"input" | "questions" | "report">("input");
  const [position, setPosition] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const { toast } = useToast();

  const generateQuestions = (position: string): Question[] => {
    const positionLower = position.toLowerCase();
    
    // Perguntas base que se adaptam à posição
    const generalQuestions = [
      {
        id: 1,
        text: `O que mais te motiva a trabalhar como ${position}?`,
        type: "geral" as const,
        level: "básico" as const
      },
      {
        id: 2,
        text: `Como você se mantém atualizado sobre as tendências da área de ${position}?`,
        type: "geral" as const,
        level: "intermediário" as const
      },
      {
        id: 3,
        text: "Onde você se vê em 5 anos na sua carreira?",
        type: "geral" as const,
        level: "básico" as const
      }
    ];

    let technicalQuestions: Question[] = [];
    
    if (positionLower.includes("marketing")) {
      technicalQuestions = [
        { id: 4, text: "Quais ferramentas de automação de marketing você já utilizou?", type: "tecnica", level: "intermediário" },
        { id: 5, text: "Como você mede o sucesso de uma campanha digital?", type: "tecnica", level: "avançado" },
        { id: 6, text: "Explique como funciona o funil de conversão.", type: "tecnica", level: "básico" },
        { id: 7, text: "Como você utilizaria dados para otimizar uma campanha de Facebook Ads?", type: "tecnica", level: "avançado" }
      ];
    } else if (positionLower.includes("desenvolvedor") || positionLower.includes("programador")) {
      technicalQuestions = [
        { id: 4, text: "Quais linguagens de programação você domina?", type: "tecnica", level: "básico" },
        { id: 5, text: "Como você garante a qualidade do código que escreve?", type: "tecnica", level: "intermediário" },
        { id: 6, text: "Explique o conceito de Clean Code.", type: "tecnica", level: "intermediário" },
        { id: 7, text: "Como você lidaria com um problema de performance em uma aplicação?", type: "tecnica", level: "avançado" }
      ];
    } else {
      technicalQuestions = [
        { id: 4, text: `Quais são as principais competências técnicas necessárias para ${position}?`, type: "tecnica", level: "básico" },
        { id: 5, text: `Descreva um projeto desafiador que você executou na área de ${position}.`, type: "tecnica", level: "intermediário" },
        { id: 6, text: `Como você mede resultados e KPIs no seu trabalho como ${position}?`, type: "tecnica", level: "avançado" },
        { id: 7, text: `Quais ferramentas ou metodologias você considera essenciais para ${position}?`, type: "tecnica", level: "intermediário" }
      ];
    }

    const situationalQuestions = [
      {
        id: 8,
        text: "Conte sobre uma situação em que precisou lidar com prazos apertados.",
        type: "situacional" as const,
        level: "intermediário" as const
      },
      {
        id: 9,
        text: "Como você lidaria com um cliente ou colega insatisfeito?",
        type: "situacional" as const,
        level: "avançado" as const
      },
      {
        id: 10,
        text: "Descreva uma vez que você precisou aprender algo novo rapidamente.",
        type: "situacional" as const,
        level: "básico" as const
      }
    ];

    return [...generalQuestions, ...technicalQuestions, ...situationalQuestions];
  };

  const analyzeFeedback = (answer: string, question: Question): Answer["feedback"] => {
    const wordCount = answer.trim().split(/\s+/).length;
    const hasExamples = /exemplo|experiência|situação|quando|vez que/i.test(answer);
    const hasStructure = answer.length > 50;
    const hasConfidence = !/talvez|acho que|não sei|meio que/i.test(answer);

    const clarity = wordCount >= 20 && wordCount <= 150 ? 85 : wordCount < 20 ? 45 : 70;
    const structure = hasStructure ? 80 : 50;
    const confidence = hasConfidence ? 85 : 60;
    const examples = hasExamples ? 90 : 40;
    const overall = Math.round((clarity + structure + confidence + examples) / 4);

    const suggestions: string[] = [];
    if (clarity < 70) suggestions.push("Tente ser mais específico e objetivo na resposta");
    if (structure < 70) suggestions.push("Organize melhor sua resposta: situação, ação, resultado");
    if (confidence < 70) suggestions.push("Demonstre mais confiança, evite palavras como 'talvez' ou 'acho que'");
    if (examples < 70) suggestions.push("Inclua exemplos práticos ou experiências pessoais");

    return { clarity, structure, confidence, examples, overall, suggestions };
  };

  const handleStartInterview = () => {
    if (!position.trim()) {
      toast({
        title: "Cargo obrigatório",
        description: "Por favor, informe o cargo pretendido para gerar as perguntas.",
        variant: "destructive"
      });
      return;
    }

    const generatedQuestions = generateQuestions(position);
    setQuestions(generatedQuestions);
    setStep("questions");
    
    toast({
      title: "Entrevista iniciada!",
      description: `10 perguntas geradas para ${position}. Boa sorte!`,
    });
  };

  const handleAnswerSubmit = () => {
    if (!currentAnswer.trim()) {
      toast({
        title: "Resposta obrigatória",
        description: "Por favor, responda a pergunta antes de continuar.",
        variant: "destructive"
      });
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    const feedback = analyzeFeedback(currentAnswer, currentQuestion);
    
    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      text: currentAnswer,
      feedback
    };

    setAnswers([...answers, newAnswer]);
    setCurrentAnswer("");

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setStep("report");
      toast({
        title: "Entrevista concluída!",
        description: "Confira seu relatório de desempenho.",
      });
    }
  };

  const generateReport = () => {
    const totalScore = answers.reduce((sum, answer) => sum + answer.feedback.overall, 0) / answers.length;
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (totalScore >= 80) strengths.push("Excelente comunicação geral");
    if (answers.filter(a => a.feedback.examples >= 80).length >= 6) strengths.push("Bom uso de exemplos práticos");
    if (answers.filter(a => a.feedback.confidence >= 80).length >= 7) strengths.push("Demonstra confiança nas respostas");
    if (answers.filter(a => a.feedback.structure >= 80).length >= 6) strengths.push("Respostas bem estruturadas");

    const lowClarity = answers.filter(a => a.feedback.clarity < 70).length;
    const lowExamples = answers.filter(a => a.feedback.examples < 70).length;
    const lowConfidence = answers.filter(a => a.feedback.confidence < 70).length;

    if (lowClarity >= 3) improvements.push("Trabalhar na clareza e objetividade");
    if (lowExamples >= 4) improvements.push("Incluir mais exemplos práticos");
    if (lowConfidence >= 3) improvements.push("Demonstrar mais confiança nas respostas");

    return { totalScore, strengths, improvements };
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "geral": return "bg-primary text-primary-foreground";
      case "tecnica": return "bg-warning text-warning-foreground";
      case "situacional": return "bg-success text-success-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  if (step === "input") {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-large">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Preparador de Entrevistas</CardTitle>
            <p className="text-muted-foreground">
              Vamos simular uma entrevista personalizada para sua área
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="position" className="text-sm font-medium">
                Qual cargo você está buscando?
              </label>
              <Input
                id="position"
                placeholder="Ex: Analista de Marketing, Desenvolvedor Front-End..."
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button 
              onClick={handleStartInterview}
              className="w-full bg-gradient-primary hover:opacity-90 transition-smooth"
              size="lg"
            >
              Iniciar Simulação
              <Send className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "questions") {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="shadow-medium">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge className={getTypeColor(currentQuestion.type)}>
                  {currentQuestion.type.charAt(0).toUpperCase() + currentQuestion.type.slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {currentQuestionIndex + 1} de {questions.length}
                </span>
              </div>
              <Progress value={progress} className="mb-4" />
              <CardTitle className="text-xl">{currentQuestion.text}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Digite sua resposta aqui..."
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentQuestionIndex > 0) {
                      setCurrentQuestionIndex(currentQuestionIndex - 1);
                    }
                  }}
                  disabled={currentQuestionIndex === 0}
                >
                  Anterior
                </Button>
                <Button 
                  onClick={handleAnswerSubmit}
                  className="bg-gradient-primary hover:opacity-90 transition-smooth"
                >
                  {currentQuestionIndex === questions.length - 1 ? "Finalizar" : "Próxima"}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "report") {
    const report = generateReport();

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card className="shadow-large">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 bg-success/10 rounded-full w-fit">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <CardTitle className="text-2xl font-bold">Relatório de Desempenho</CardTitle>
              <p className="text-muted-foreground">
                Confira sua performance na simulação para {position}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score Geral */}
              <div className="text-center p-6 bg-gradient-primary rounded-lg text-white">
                <div className="text-4xl font-bold mb-2">{Math.round(report.totalScore)}%</div>
                <div className="text-primary-foreground/80">Pontuação Geral</div>
              </div>

              {/* Pontos Fortes */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-success" />
                  Pontos Fortes
                </h3>
                <div className="space-y-2">
                  {report.strengths.map((strength, index) => (
                    <div key={index} className="flex items-center p-3 bg-success/10 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-success mr-2" />
                      <span>{strength}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pontos de Melhoria */}
              {report.improvements.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center">
                    <AlertCircle className="mr-2 h-5 w-5 text-warning" />
                    Pontos de Melhoria
                  </h3>
                  <div className="space-y-2">
                    {report.improvements.map((improvement, index) => (
                      <div key={index} className="flex items-center p-3 bg-warning/10 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-warning mr-2" />
                        <span>{improvement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detalhes por Pergunta */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Feedback Detalhado</h3>
                <div className="space-y-3">
                  {answers.map((answer, index) => {
                    const question = questions.find(q => q.id === answer.questionId);
                    return (
                      <Card key={answer.questionId} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge className={getTypeColor(question?.type || "")}>
                            Pergunta {index + 1}
                          </Badge>
                          <span className={`font-bold ${getScoreColor(answer.feedback.overall)}`}>
                            {answer.feedback.overall}%
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{question?.text}</p>
                        {answer.feedback.suggestions.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <strong>Sugestões:</strong> {answer.feedback.suggestions.join(", ")}
                          </div>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>

              <Button 
                onClick={() => {
                  setStep("input");
                  setPosition("");
                  setCurrentQuestionIndex(0);
                  setAnswers([]);
                  setCurrentAnswer("");
                  setQuestions([]);
                }}
                className="w-full bg-gradient-primary hover:opacity-90 transition-smooth"
                size="lg"
              >
                Nova Simulação
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default InterviewChat;