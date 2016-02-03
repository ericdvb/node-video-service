import Recorder from '../node_modules/recorderjs/recorder';
import Tone from '../node_modules/tone/build/Tone';
import $ from '../node_modules/jquery/dist/jquery';

var sampler = new Tone.Sampler({1: '../assets/boing.wav'}).toMaster();
//var recorder = new Recorder();

/**
 * event handling
 *
 * controls what happens when any of the buttons are hit
 *
 */
$('#one').on('click', (e) => {
  console.log('you clicked button one');
});
Tone.Buffer.onLoad = () => {
  $('#one').on('click', (e) => {
    sampler.triggerAttack('1');
  })
}
