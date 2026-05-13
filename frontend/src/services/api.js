// URL simplifiée — le proxy Vite s'occupe du reste
const API_URL = '/api';

export const sendMessage = async (messages, language = 'fr') => {
  try {
    const response = await fetch(`${API_URL}/chatbot/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, language }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur serveur');
    }

    return await response.json();

  } catch (error) {
    console.error('❌ Erreur API:', error.message);
    throw error;
  }
};