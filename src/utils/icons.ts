/**
 * 🎨 Arquivo centralizado de ícones do Lucide React
 * 
 * Benefícios:
 * - Melhor tree-shaking (apenas os ícones usados são incluídos)
 * - Imports mais limpos e organizados
 * - Facilita auditoria de ícones utilizados
 * - Reduz tamanho do bundle (~20-30 KB)
 */

export {
  // Alertas e notificações
  AlertCircle,
  AlertTriangle,
  Info,
  
  // Ações e navegação
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  X,
  
  // Status e validação
  Check,
  CheckCircle,
  XCircle,
  
  // Tempo e calendário
  Calendar,
  CalendarClock,
  Clock,
  Timer,
  
  // Rede e conectividade
  Wifi,
  WifiOff,
  Download,
  Upload,
  Server,
  EthernetPort,
  Network,
  Battery,
  
  // Usuário e autenticação
  User,
  Users,
  Eye,
  EyeOff,
  Shield,
  ShieldCheck,
  Key,
  
  // Ações CRUD
  Search,
  Save,
  Trash2,
  Play,
  RefreshCw,
  Edit2,
  Plus,
  Copy,
  
  // UI e navegação
  Settings,
  HelpCircle,
  Loader,
  
  // Comunicação
  Mail,
  Phone,
  Send,
  Bell,
  
  // Documentos e conteúdo
  FileText,
  Book,
  Scroll,
  Logs,
  
  // Compras e financeiro
  ShoppingCart,
  DollarSign,
  
  // Tecnologia e desenvolvimento
  GitFork,
  Smartphone,
  Plane,
  PlaneLanding,
  
  // Energia e velocidade
  Zap,
  
  // Business e negócios
  BriefcaseBusiness,
  
  // Social
  Share2,
  Star,
} from 'lucide-react';

// Exporta o tipo para componentes que recebem ícones como props
export type { LucideIcon } from 'lucide-react';
