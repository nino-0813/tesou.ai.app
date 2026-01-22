
import React from 'react';
import { 
  Users, 
  Heart, 
  Coins, 
  UserCircle, 
  CloudSun,
  Camera,
  RotateCcw,
  CheckCircle2,
  Share2
} from 'lucide-react';

export const ZODIAC_LIST = [
  { id: 'Aries', name: '牡羊座', icon: '♈' },
  { id: 'Taurus', name: '牡牛座', icon: '♉' },
  { id: 'Gemini', name: '双子座', icon: '♊' },
  { id: 'Cancer', name: '蟹座', icon: '♋' },
  { id: 'Leo', name: '獅子座', icon: '♌' },
  { id: 'Virgo', name: '乙女座', icon: '♍' },
  { id: 'Libra', name: '天秤座', icon: '♎' },
  { id: 'Scorpio', name: '蠍座', icon: '♏' },
  { id: 'Sagittarius', name: '射手座', icon: '♐' },
  { id: 'Capricorn', name: '山羊座', icon: '♑' },
  { id: 'Aquarius', name: '水瓶座', icon: '♒' },
  { id: 'Pisces', name: '魚座', icon: '♓' },
];

export const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  nature: <UserCircle className="w-5 h-5" />,
  love: <Heart className="w-5 h-5" />,
  money: <Coins className="w-5 h-5" />,
  relation: <Users className="w-5 h-5" />,
  life: <CloudSun className="w-5 h-5" />,
};
