import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  timestamp: Date;
}

interface SimulationContextType {
  heartRate: number;
  steps: number;
  walletBalance: number;
  notifications: Notification[];
  nextAppointment: Date;
  isSimulationActive: boolean;
  toggleSimulation: () => void;
  dismissNotification: (id: string) => void;
  addNotification: (message: string, type?: 'success' | 'info' | 'warning') => void;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

export const SimulationProvider = ({ children }: { children?: ReactNode }) => {
  const [isSimulationActive, setIsSimulationActive] = useState(true);
  const [heartRate, setHeartRate] = useState(72);
  const [steps, setSteps] = useState(8432);
  const [walletBalance, setWalletBalance] = useState(1250.00);
  // Notifications always empty - completely disabled
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Ensure notifications stay empty
  useEffect(() => {
    setNotifications([]);
  }, []);
  
  // Set appointment to tomorrow at 10 AM relative to load time
  const [nextAppointment] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    return d;
  });

  const addNotification = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
      // Notifications completely disabled - do nothing
      setNotifications([]);
      // const newNotif = { id: Date.now().toString(), message, type, timestamp: new Date() };
      // setNotifications(prev => [newNotif, ...prev].slice(0, 3)); // Keep max 3
      
      // Auto dismiss after 5 seconds
      // setTimeout(() => {
      //     dismissNotification(newNotif.id);
      // }, 5000);
  };

  const dismissNotification = (id: string) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Heart Rate Simulation (Every 2s)
  useEffect(() => {
    if (!isSimulationActive) return;
    const interval = setInterval(() => {
      setHeartRate(prev => {
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2 variation
        const newValue = prev + change;
        // Keep between 65 and 95
        return newValue > 95 ? 95 : newValue < 65 ? 65 : newValue;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isSimulationActive]);

  // Steps Simulation (Every 4s)
  useEffect(() => {
    if (!isSimulationActive) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.3) { // 70% chance to walk
          setSteps(prev => prev + Math.floor(Math.random() * 4) + 1);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isSimulationActive]);

  // Wallet Passive Earning (Every 15s)
  useEffect(() => {
    if (!isSimulationActive) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.6) { // 40% chance to earn
         const amount = 0.5;
         setWalletBalance(prev => Number((prev + amount).toFixed(2)));
         // Optional: verbose notification for earnings
         // addNotification(`Passive Income: +${amount} RDM`, 'success'); 
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [isSimulationActive]);

  // Random System Notifications (Every 30-60s) - COMPLETELY DISABLED
  useEffect(() => {
    // Notifications disabled - do nothing
    setNotifications([]);
    return;
    // if (!isSimulationActive) return;
    // const messages = [
    //     { msg: "Dr. Smith verified your vitals log", type: 'success' },
    //     { msg: "Goal Achieved: Morning Hydration", type: 'success' },
    //     { msg: "New reward unlocked in Marketplace", type: 'info' },
    //     { msg: "Market Trend: RDM value up 2%", type: 'info' },
    //     { msg: "Reminder: Take Vitamin D", type: 'warning' }
    // ];
    
    // const triggerRandom = () => {
    //     const item = messages[Math.floor(Math.random() * messages.length)];
    //     addNotification(item.msg, item.type as any);
        
    //     // Schedule next
    //     const nextDelay = Math.random() * 30000 + 30000; 
    //     timeoutId = setTimeout(triggerRandom, nextDelay);
    // };

    // let timeoutId = setTimeout(triggerRandom, 10000); // First one after 10s

    // return () => clearTimeout(timeoutId);
  }, [isSimulationActive]);

  const toggleSimulation = () => setIsSimulationActive(!isSimulationActive);

  return (
    <SimulationContext.Provider value={{ 
        heartRate, 
        steps, 
        walletBalance, 
        notifications, 
        nextAppointment, 
        isSimulationActive, 
        toggleSimulation, 
        dismissNotification,
        addNotification
    }}>
      {children}
    </SimulationContext.Provider>
  );
};

export const useSimulation = () => {
  const context = useContext(SimulationContext);
  if (!context) throw new Error('useSimulation must be used within a SimulationProvider');
  return context;
};

