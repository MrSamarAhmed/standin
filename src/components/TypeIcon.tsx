import {
  Building,
  CircleDollarSign,
  FingerprintPattern,
  Link2,
  Mail,
  MapPin,
  MapPinned,
  PenLine,
  Phone,
  Tag,
  User,
} from 'lucide-react';
import type { EntityType } from '../lib/types';

const ICONS = {
  PERSON: User,
  ORG: Building,
  LOCATION: MapPin,
  MISC: Tag,
  EMAIL: Mail,
  PHONE: Phone,
  ID: FingerprintPattern,
  MONEY: CircleDollarSign,
  ADDRESS: MapPinned,
  URL: Link2,
  CUSTOM: PenLine,
} as const;

export function TypeIcon({
  type,
  size = 15,
  className,
}: {
  type: EntityType;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[type];
  return <Icon size={size} strokeWidth={1.8} aria-hidden className={className} />;
}
