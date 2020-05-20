import { useState, useEffect } from 'react';

export const useFetch = (fetch_url = '') => {
  const [url, setUrl] = useState(fetch_url);
  const [response, setResponse] = useState();
  const [error, setError] = useState();
  const [is_loading, setIsLoading] = useState(false);
  useEffect(() => {
    if (!url) return;
    const abortController = new AbortController();
    const signal = abortController.signal;
    setIsLoading(true);
    fetch(url, { signal: signal })
      .then(results => results.json())
      .then(response => {
        setIsLoading(false);
        setResponse(response);
      })
      .catch(err => {
        setIsLoading(false);
        if (err.name === 'AbortError') return;
        setError(err);
        //throw err;
      });
    return () => {
      abortController.abort();
    };
  }, [url]);
  return [response, setResponse, setUrl, error, is_loading];
};
