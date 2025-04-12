// script.js

// DOM Elements
const authScreen = document.getElementById('auth-screen');
const dashboard = document.getElementById('dashboard');
const recorderUI = document.getElementById('recorder-ui');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const stopBtn = document.getElementById('stop-btn');
const videoPlayer = document.getElementById('video-player');
const webcamPreview = document.getElementById('webcam-preview');
const userNameElement = document.getElementById('user-name');
const screenRecorderBtn = document.getElementById('screen-recorder-btn');
const videoRecorderBtn = document.getElementById('video-recorder-btn');
const bothRecorderBtn = document.getElementById('both-recorder-btn');
const videoList = document.getElementById('video-list');
const sortSelect = document.getElementById('sort-select');
const includeCamera = document.getElementById('include-camera');
const includeAudio = document.getElementById('include-audio');

// States
let userLoggedIn = false;
let isRecording = false;
let isPaused = false;
let mediaRecorder;
let videoChunks = [];
let videoBlob;
let videoURL;
let userName = "User";

function login(username, password) {
  userLoggedIn = true;
  userName = username || "User";
  userNameElement.textContent = userName;
  authScreen.classList.add('hidden');
  dashboard.classList.remove('hidden');
  recorderUI.classList.remove('hidden');
  loadRecordings();
}

function signup(username, password) {
  login(username, password);
}

function startRecording(mode = 'screen') {
  let captureStream;

  const getStream = async () => {
    try {
      if (mode === 'screen' || mode === 'both') {
        captureStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: includeAudio.checked
        });
      } else {
        captureStream = await navigator.mediaDevices.getUserMedia({
          video: includeCamera.checked,
          audio: includeAudio.checked
        });
      }

      if (mode === 'both') {
        const webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
        webcamPreview.srcObject = webcamStream;
        webcamPreview.classList.remove('hidden');
      }

      videoPlayer.srcObject = captureStream;
      mediaRecorder = new MediaRecorder(captureStream);

      mediaRecorder.ondataavailable = (e) => videoChunks.push(e.data);
      mediaRecorder.onstop = () => {
        videoBlob = new Blob(videoChunks, { type: 'video/webm' });
        videoURL = URL.createObjectURL(videoBlob);
        const id = Date.now();
        const recording = {
          id,
          name: `${userName}'s Recording`,
          date: new Date().toISOString(),
          url: videoURL
        };
        saveRecording(recording);
        addRecordingToDOM(recording);
        videoChunks = [];
      };

      mediaRecorder.start();
      isRecording = true;
      updateRecorderUI();

      document.documentElement.requestFullscreen();
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };

  getStream();
}

function pauseRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.pause();
    isPaused = true;
    updateRecorderUI();
  }
}

function resumeRecording() {
  if (mediaRecorder && mediaRecorder.state === 'paused') {
    mediaRecorder.resume();
    isPaused = false;
    updateRecorderUI();
  }
}

function stopRecording() {
  if (mediaRecorder) {
    mediaRecorder.stop();
    isRecording = false;
    updateRecorderUI();
    document.exitFullscreen();
  }
}

function saveRecording(recording) {
  const recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
  recordings.push(recording);
  localStorage.setItem('recordings', JSON.stringify(recordings));
}

function loadRecordings() {
  const recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
  videoList.innerHTML = '';
  recordings.forEach(addRecordingToDOM);
}

function addRecordingToDOM(recording) {
  const item = document.createElement('div');
  item.className = 'video-item';
  item.innerHTML = `
    <video src="${recording.url}" controls poster="" width="100%"></video>
    <input type="text" value="${recording.name}" class="text-center font-bold rename-input mb-2" onchange="renameRecording(${recording.id}, this.value)" />
    <p>${new Date(recording.date).toLocaleString()}</p>
    <button class="delete-btn" onclick="deleteRecording(${recording.id}, this)">Delete</button>
  `;
  videoList.appendChild(item);
}

function deleteRecording(id, button) {
  let recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
  recordings = recordings.filter(r => r.id !== id);
  localStorage.setItem('recordings', JSON.stringify(recordings));
  const videoItem = button.closest('.video-item');
  videoItem.remove();
}

function renameRecording(id, newName) {
  const recordings = JSON.parse(localStorage.getItem('recordings') || '[]');
  const index = recordings.findIndex(r => r.id === id);
  if (index !== -1) {
    recordings[index].name = newName;
    localStorage.setItem('recordings', JSON.stringify(recordings));
  }
}

function updateRecorderUI() {
  startBtn.classList.toggle('hidden', isRecording);
  pauseBtn.classList.toggle('hidden', !isRecording || isPaused);
  resumeBtn.classList.toggle('hidden', !isPaused);
  stopBtn.classList.toggle('hidden', !isRecording);
}

sortSelect.addEventListener('change', () => {
  const sortValue = sortSelect.value;
  const recordings = JSON.parse(localStorage.getItem('recordings') || '[]');

  recordings.sort((a, b) => {
    return sortValue === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date);
  });

  videoList.innerHTML = '';
  recordings.forEach(addRecordingToDOM);
});

loginBtn.addEventListener('click', () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  login(username, password);
});

signupBtn.addEventListener('click', () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  signup(username, password);
});

startBtn.addEventListener('click', () => startRecording());
pauseBtn.addEventListener('click', pauseRecording);
resumeBtn.addEventListener('click', resumeRecording);
stopBtn.addEventListener('click', stopRecording);

screenRecorderBtn.addEventListener('click', () => {
  startRecording('screen');
});

videoRecorderBtn.addEventListener('click', () => {
  startRecording('video');
});

bothRecorderBtn.addEventListener('click', () => {
  startRecording('both');
});

document.addEventListener('DOMContentLoaded', () => {
  dashboard.classList.add('hidden');
  recorderUI.classList.add('hidden');
});
