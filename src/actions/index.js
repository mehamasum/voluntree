export const postFetch = (fetchUrl, postData = {}) => {
    const requestOptions = {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Token ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify(postData)
    };
    return fetch(fetchUrl, requestOptions)
      .then(response => {
        if(response.status != 204) { // status 204 for loggedout
          return response.json();
        } else return Promise.resolve();
      })
}


export const getFetch = (fetchUrl) => {
  const abortController = new AbortController();
  const signal = abortController.signal;

  return  fetch(fetchUrl, {
    signal: signal,
    headers: {'Authorization': `Token ${localStorage.getItem('token')}` }
    })
    .then(response => {
      if(response.status != 204) { // status 204 for loggedout
        return response.json();
      } else return Promise.resolve();
    })
}



export const DeleteFetch = (fetchUrl) => {
  const requestOptions = {
    method: 'DELETE',
    headers: { 
      'Authorization': `Token ${localStorage.getItem('token')}` 
    },
  };
  return fetch(fetchUrl, requestOptions)
}