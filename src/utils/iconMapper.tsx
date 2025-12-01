import { FaDiceOne, FaFire, FaInfoCircle, FaBalanceScale, FaTrophy, FaUsers, FaCalendar } from 'react-icons/fa';

export const getIcon = (iconName: string) => {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'FaDiceOne': FaDiceOne,
    'FaFire': FaFire,
    'FaInfoCircle': FaInfoCircle,
    'FaBalanceScale': FaBalanceScale,
    'FaTrophy': FaTrophy,
    'FaUsers': FaUsers,
    'FaCalendar': FaCalendar,
  };

  return iconMap[iconName] || FaInfoCircle;
};
