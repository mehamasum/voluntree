export const postFetch = (fetchUrl, postData) => {
    const requestOptions = {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Token ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify(postData)
    };
    return fetch(fetchUrl, requestOptions)
      .then(response => response.json())
}
