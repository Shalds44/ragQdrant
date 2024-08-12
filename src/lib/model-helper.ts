export function getSelectedModel(): string {
    if (typeof window !== 'undefined') {
      const model = 'phi3:3.8b'
      const storedModel = localStorage.getItem('selectedModel');
      return storedModel || 'gemma:2b';
    } else {
      // Default model
      return 'gemma:2b';
    }
  }