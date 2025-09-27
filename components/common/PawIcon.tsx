import React from 'react';
import { Svg, Ellipse, Path } from 'react-native-svg';

interface PawIconProps {
  size?: number;
  color?: string;
  fill?: string;
}

export const PawIcon: React.FC<PawIconProps> = ({ 
  size = 28, 
  color = '#8B5CF6',
  fill = '#8B5CF6'
}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      {/* Ana pati şekli */}
      <Ellipse cx="60" cy="80" rx="35" ry="25" fill={fill} stroke={color} strokeWidth="2"/>
      
      {/* Üst parmaklar */}
      <Ellipse cx="45" cy="55" rx="12" ry="18" fill={fill} stroke={color} strokeWidth="2"/>
      <Ellipse cx="60" cy="50" rx="12" ry="18" fill={fill} stroke={color} strokeWidth="2"/>
      <Ellipse cx="75" cy="55" rx="12" ry="18" fill={fill} stroke={color} strokeWidth="2"/>
      
      {/* Alt parmaklar */}
      <Ellipse cx="50" cy="70" rx="10" ry="15" fill={fill} stroke={color} strokeWidth="2"/>
      <Ellipse cx="70" cy="70" rx="10" ry="15" fill={fill} stroke={color} strokeWidth="2"/>
      
      {/* Tırnaklar */}
      <Ellipse cx="45" cy="45" rx="3" ry="8" fill="#2D3748" transform="rotate(-15 45 45)"/>
      <Ellipse cx="60" cy="40" rx="3" ry="8" fill="#2D3748" transform="rotate(0 60 40)"/>
      <Ellipse cx="75" cy="45" rx="3" ry="8" fill="#2D3748" transform="rotate(15 75 45)"/>
      <Ellipse cx="50" cy="60" rx="3" ry="8" fill="#2D3748" transform="rotate(-10 50 60)"/>
      <Ellipse cx="70" cy="60" rx="3" ry="8" fill="#2D3748" transform="rotate(10 70 60)"/>
      
      {/* Pati yastığı detayları */}
      <Ellipse cx="60" cy="80" rx="25" ry="15" fill="#A78BFA" opacity="0.3"/>
      <Ellipse cx="45" cy="55" rx="8" ry="12" fill="#A78BFA" opacity="0.3"/>
      <Ellipse cx="60" cy="50" rx="8" ry="12" fill="#A78BFA" opacity="0.3"/>
      <Ellipse cx="75" cy="55" rx="8" ry="12" fill="#A78BFA" opacity="0.3"/>
    </Svg>
  );
};
