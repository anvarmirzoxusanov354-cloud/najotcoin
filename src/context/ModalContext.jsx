import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState({});

  const openModal = useCallback((id, direction) => {
    setModals(prev => {
      const newModals = { ...prev };
      
      // Close all modals with opposite direction
      if (direction === 'rtl') {
        // Close left-to-right opening modals
        Object.keys(newModals).forEach(key => {
          if (newModals[key].direction === 'ltr') {
            newModals[key].isOpen = false;
          }
        });
      } else if (direction === 'ltr') {
        // Close right-to-left opening modals
        Object.keys(newModals).forEach(key => {
          if (newModals[key].direction === 'rtl') {
            newModals[key].isOpen = false;
          }
        });
      }
      
      // Open the requested modal
      newModals[id] = { isOpen: true, direction };
      return newModals;
    });
  }, []);

  const closeModal = useCallback((id) => {
    setModals(prev => ({
      ...prev,
      [id]: { ...prev[id], isOpen: false }
    }));
  }, []);

  const closeAllModals = useCallback(() => {
    setModals(prev => {
      const newModals = { ...prev };
      Object.keys(newModals).forEach(key => {
        newModals[key].isOpen = false;
      });
      return newModals;
    });
  }, []);

  const isModalOpen = useCallback((id) => {
    return modals[id]?.isOpen || false;
  }, [modals]);

  const value = {
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    modals
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};
