function speakText(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.2;
  window.speechSynthesis.speak(utterance);
}

function stopSpeaking() {
  window.speechSynthesis.cancel();
}
