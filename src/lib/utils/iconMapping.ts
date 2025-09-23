// Icon mapping utility for tree-shaking optimization
// Only imports icons that are actually used in the application

import React from 'react'
import {
  // Essential icons used throughout the app
  Wifi,
  Car,
  Coffee,
  Utensils,
  Users,
  Bath,
  Bed,
  Home,
  MapPin,
  Euro,
  Star,
  Check,
  CheckCircle,
  X,
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Upload,
  Download,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Search,
  Filter,
  Heart,
  Share,
  Calendar,
  Clock,
  Phone,
  Mail,
  User,
  Settings,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  Menu,
  MoreHorizontal,
  Camera,
  Image,
  FileText,
  Package,
  Shield,
  Zap,
  Tv,
  AirVent,
  Refrigerator,
  WashingMachine,
  Microwave,
  Gamepad2,
  Dumbbell,
  Trees,
  Mountain,
  ParkingCircle,
  Baby,
  Dog,
  Cat,
  Volume2,
  Signal,
  Flame,
  Droplets,
  Lightbulb,
  Fan,
  Heater,
  ShowerHead,
  Sparkles,
  Sofa,
  Armchair,
  Lamp,
  BookOpen,
  Music,
  Monitor,
  Laptop,
  Printer,
  // Navigation & UI icons
  Power,
  PowerOff,
  RotateCcw,
  RefreshCw,
  MessageSquare,
  Navigation,
  Compass,
  Globe,
  Building,
  Store,
  Award,
  Crown,
  Trophy
} from 'lucide-react'

// Create icon mapping object for dynamic lookups
export const ICON_MAP = {
  // Common equipment icons
  Wifi,
  Car,
  Coffee,
  Utensils,
  Users,
  Bath,
  Bed,
  Home,
  Tv,
  AirVent,
  Refrigerator,
  WashingMachine,
  Microwave,
  Gamepad2,
  Dumbbell,
  Trees,
  Mountain,
  ParkingCircle,
  Baby,
  Dog,
  Cat,
  Volume2,
  Signal,
  Flame,
  Droplets,
  Lightbulb,
  Fan,
  Heater,
  ShowerHead,
  Sparkles,
  Sofa,
  Armchair,
  Lamp,
  BookOpen,
  Music,
  Monitor,
  Laptop,
  Printer,
  // UI icons
  CheckCircle,
  Star,
  Check,
  X,
  Plus,
  Minus,
  Edit,
  Trash2,
  Save,
  Upload,
  Download,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Search,
  Filter,
  Heart,
  Share,
  Calendar,
  Clock,
  Phone,
  Mail,
  User,
  Settings,
  Loader2,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  Menu,
  MoreHorizontal,
  Camera,
  Image,
  FileText,
  Package,
  Shield,
  Zap,
  MapPin,
  Euro,
  // Navigation & utility icons
  Power,
  PowerOff,
  RotateCcw,
  RefreshCw,
  MessageSquare,
  Navigation,
  Compass,
  Globe,
  Building,
  Store,
  Award,
  Crown,
  Trophy
} as const

// Type for available icon names
export type IconName = keyof typeof ICON_MAP

// Dynamic icon component that falls back to CheckCircle if icon not found
export function DynamicIcon({ 
  name, 
  className = '', 
  fallback = CheckCircle 
}: { 
  name: string
  className?: string
  fallback?: React.ComponentType<{ className?: string }>
}) {
  const IconComponent = ICON_MAP[name as IconName] || fallback
  return React.createElement(IconComponent, { className })
}

// Helper function to get icon component by name
export function getIconComponent(name: string) {
  return ICON_MAP[name as IconName] || CheckCircle
}

// Validate if an icon exists in our mapping
export function hasIcon(name: string): boolean {
  return name in ICON_MAP
}

// Get all available icon names
export function getAvailableIcons(): IconName[] {
  return Object.keys(ICON_MAP) as IconName[]
}