import {
  Wifi,
  Wind,
  Droplets,
  Zap,
  Shield,
  Camera,
  Dumbbell,
  TreePine,
  Sofa,
  CheckCircle,
  Car,
} from 'lucide-react'

/** Optional icon mapping for known feature names; unknown features use CheckCircle. */
export const featureIcons = {
  'Wi-Fi': Wifi,
  'Balcony': Sofa,
  'Garden': TreePine,
  'Security': Shield,
  'CCTV': Camera,
  'Air Conditioning': Wind,
  'Swimming Pool': Droplets,
  'Pool': Droplets,
  'Gym': Dumbbell,
  'Water Supply': Droplets,
  'Electricity': Zap,
  'Parking': Car,
  'Elevator': CheckCircle,
}

export function getFeatureIcon(name) {
  return featureIcons[name] || CheckCircle
}
