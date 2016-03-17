import $ from '../node_modules/jquery/dist/jquery';

function constructForm(form, request, shareToType) {
  var file = form.elements['video'];
  var formData = new FormData();

  request.onreadystatechange = function() {
    if( request.readystate === 4 ) {
      request.status === 200 ?
        console.log('request successful!') :
        console.log('request failed :(');
    }
  }

  if(file.files.length) {
    formData.append('video', file.files[0], file.value.split('/').pop());
    formData.append(shareToType, form.elements['shareTo'].value);
  }

  return formData;
};

$('#tweet-video').on('mouseup', (e) => {
  console.log('attempting to tweet video');
  var request = new XMLHttpRequest();
  var formData = constructForm(e.target.parentNode, request, 'twitterName');

  request.open('POST', '/video');
  request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  request.send(formData);

  return false;
});

$('#email-video').on('mouseup', (e) => {
  console.log('attempting to email video');
  var request = new XMLHttpRequest();
  var formData = constructForm(e.target.parentNode, request, 'email');

  request.open('POST', '/video');
  request.setRequestHeader('X-Requested-With', 'XMLHttpReqest');
  request.send(formData);

  return false;
});

$('#queue-request').on('mouseup', (e) => {
  console.log('fake request button clicked');
  var request = new XMLHttpRequest();
  request.open('POST', '/fake');
  request.setRequestHeader('X-Requested-With', 'XMLHttpReqest');
  request.send();
  return false;
});

$('#start-requests').on('mouseup', (e) => {
  console.log('fake request button clicked');
  var request = new XMLHttpRequest();
  request.open('POST', '/start');
  request.setRequestHeader('X-Requested-With', 'XMLHttpReqest');
  request.send();
  return false;
});
