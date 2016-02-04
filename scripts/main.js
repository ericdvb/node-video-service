import Recorder from '../node_modules/recorderjs/recorder';
import Tone from '../node_modules/tone/build/Tone';
import $ from '../node_modules/jquery/dist/jquery';

var sampler = new Tone.Sampler({
  1: '../assets/audio/505/kick.mp3',
  2: '../assets/audio/505/snare.mp3',
  3: '../assets/audio/505/hh.mp3',
  4: '../assets/audio/505/hho.mp3'
}).toMaster();

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
var recorder = new Recorder(Tone.Master);
});
