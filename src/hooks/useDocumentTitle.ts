import { useEffect } from 'react';
import { isWeb } from '@utils/platform';

/**
 * Custom hook to dynamically set the document title (browser tab title) on web
 * 
 * @param title - The title to set (can be a translated string)
 * @param baseTitle - Optional base title to append (defaults to "MyApp")
 * 
 * @example
 * // Simple usage
 * useDocumentTitle('User Management');
 * 
 * // With participant name
 * useDocumentTitle(`${participantName} - Participant Details`);
 */
export const useDocumentTitle = (title: string, baseTitle: string = 'MyApp') => {
  useEffect(() => {
    if (isWeb && typeof document !== 'undefined' && title) {
      const previousTitle = document.title;
      // Set the new title
      document.title = `${title} | ${baseTitle}`;
      
      // Cleanup: restore previous title when component unmounts
      return () => {
        document.title = previousTitle;
      };
    }
  }, [title, baseTitle]);
};

export default useDocumentTitle;
