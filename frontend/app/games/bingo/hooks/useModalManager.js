import { useState, useEffect, useRef } from 'react';

const useModalManager = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [modalQueue, setModalQueue] = useState([]);
  const modalHistory = useRef([]);

  useEffect(() => {
    console.log(`[ModalManager] Estado cambiado`, {
      activeModal,
      queueLength: modalQueue.length,
      queue: modalQueue,
      timestamp: new Date().toISOString()
    });
  }, [activeModal, modalQueue]);

  const showModal = (modalName) => {
    console.log(`[ModalManager] Solicitando mostrar modal: ${modalName}`, {
      currentActive: activeModal,
      timestamp: new Date().toISOString()
    });

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
    console.log(`[ModalManager] Solicitando ocultar modal: ${modalName}`, {
      currentActive: activeModal,
      timestamp: new Date().toISOString()
    });

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
    console.log(`[ModalManager] Limpiando todos los modales`);
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
