// ImagemModal.jsx
import React, { useEffect } from 'react';

const ImagemModal = ({ imagem, onFechar }) => {
    useEffect(() => {
        if (imagem) {
            const original = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = original; };
        }
    }, [imagem]);

    if (!imagem) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                cursor: 'zoom-out',
                overflow: 'hidden',        // <-- ESSENCIAL
                height: '100vh'            // <-- GARANTE QUE NÃO TENHA EXCESSO
            }}
            onClick={onFechar}
            onKeyDown={e => e.key === 'Escape' && onFechar()}
            tabIndex={0}
        >
            <img
                src={imagem}
                alt="Imagem em tela cheia"
                style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    boxShadow: '0 0 20px #000',
                    margin: 'auto',
                    display: 'block',
                    animation: 'fadeIn 0.3s ease-out'
                }}
                onClick={e => e.stopPropagation()}
            />
        </div>
    );
};

export default ImagemModal;
