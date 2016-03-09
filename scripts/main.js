import Recorder from './Recorderjs/lib/index';
import Tone from '../node_modules/tone/build/Tone';
import $ from '../node_modules/jquery/dist/jquery';

var sampler = new Tone.Sampler({
  1: '../assets/audio/505/kick.mp3',
  2: '../assets/audio/505/snare.mp3',
  3: '../assets/audio/505/hh.mp3',
  4: '../assets/audio/505/hho.mp3'
}).toMaster();
var recorderInput = Tone.context.createGain();
var recorder = new Recorder(recorderInput);
var player = new Tone.Player().toMaster();
var fileReader = new FileReader();
sampler.connect(recorderInput);

/**
 * event handling
 *
 * controls what happens when any of the buttons are hit
 *
 */
Tone.Buffer.on('load', () => {

  $('#one').on('click', (e) => {
    console.log('you clicked button one');
    sampler.triggerAttack('1');
  }); 

  $('#two').on('click', (e) => {
    console.log('you clicked button two');
    sampler.triggerAttack('2');
  }); 

  $('#three').on('click', (e) => {
    console.log('you clicked button three');
    sampler.triggerAttack('3');
  }); 

  $('#four').on('click', (e) => {
    console.log('you clicked button four');
    sampler.triggerAttack('4');
  });

  $('#record').on('click', (e) => {
    if(recorder.recording === false) {
      recorder.record();
      console.log('is recorder recording? ' + recorder.recording);
    } else if (recorder.recording === true) {
      recorder.stop();
      recorder.getBuffer( (buffers) => {
        var playerBuffer = Tone.context.createBuffer( 2, buffers[0].length, Tone.context.sampleRate ); 
        playerBuffer.getChannelData(0).set(buffers[0]);
        playerBuffer.getChannelData(1).set(buffers[1]);
        player.buffer = playerBuffer;
        //player.start();
      });

      recorder.exportWAV( (audioBlob) => {
        console.log('doing something');
        var request = new XMLHttpRequest();
        request.open('POST', '/combine');
        request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        request.onload = function() {
          console.log('request successful');
        }

        fileReader.onload = (e) => {
          //request.setRequestHeader('Content-Type', audioBlob.type);

          // Send JSON in request body
          //request.setRequestHeader('Content-Type', 'application/json');
          //request.send(JSON.stringify({ "test": "test" }));

          // Send URL Encoded Blob contents in request body
          request.setRequestHeader('Content-Type', 'text/plain');
          request.send(e.target.result);
          console.log('request sent');
        };

        fileReader.readAsDataURL(audioBlob);
      });
    }
  });

  $('#file-upload').on('submit', (e) => {
    console.log('submit event');
    var form = e.target;
    var data = new FormData(form);
    var request = new XMLHttpRequest();

    request.onreadystatechange = function() {
      if( request.readystate === 4 ) {
        request.status === 200 ?
          console.log('request successful!') :
          console.log('request failed :(');
      }
    }

    request.open(form.method, form.action);
    request.send(data);

    return false;
  });
});
