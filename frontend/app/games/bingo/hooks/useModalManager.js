import { useState, useEffect, useRef } from 'react';

const useModalManager = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [modalQueue, setModalQueue] = useState([]);
  const modalHistory = useRef([]);

  const showModal = (modalName) => {
    if (!activeModal) {
      setActiveModal(modalName);
      modalHistory.current.push(modalName);
    } else {
      // Si hay un modal activo, agregar a la cola
      setModalQueue(prev => {
        if (!prev.includes(modalName)) {
          return [...prev, modalName];
        }
        return prev;
      });
    }
  };

  const hideModal = (modalName) => {
    if (activeModal === modalName) {
      setActiveModal(null);
      
      // Mostrar el siguiente modal en la cola
      if (modalQueue.length > 0) {
        const nextModal = modalQueue[0];
        setModalQueue(prev => prev.slice(1));
        setTimeout(() => {
          setActiveModal(nextModal);
          modalHistory.current.push(nextModal);
        }, 100); // Pequeño delay para evitar conflictos
      }
    } else {
      // Remover de la cola si está ahí
      setModalQueue(prev => prev.filter(modal => modal !== modalName));
    }
  };

  const isModalVisible = (modalName) => {
    return activeModal === modalName;
  };

  const clearAllModals = () => {
    setActiveModal(null);
    setModalQueue([]);
  };

  return {
    showModal,
    hideModal,
    isModalVisible,
    clearAllModals,
    activeModal,
    modalHistory: modalHistory.current
  };
};

export default useModalManager;
