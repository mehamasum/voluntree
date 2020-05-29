export const postFetch = (fetchUrl, postData) => {
    let response, status, error = null;
    const requestOptions = {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Token ${localStorage.getItem('token')}` 
      },
      body: JSON.stringify(postData)
    };
    fetch(fetchUrl, requestOptions)
      .then(response => {
        status = response.status;
        response = response.json;
        return response;
      })
      .catch(err => {
        error = err;
      });

      return [response, status, error];

}
