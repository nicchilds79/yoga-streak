const POSES = [
  { sanskrit: "Vṛkṣāsana", phonetic: "vrik-SHAH-suh-nuh", spoken: "vrik shah suh nuh", english: "Tree Pose", emoji: "🌳", hook: "Vriksha means tree: root down before you grow up.", cue: "Press foot and inner thigh together; find one still point." },
  { sanskrit: "Utkatasana", phonetic: "oot-kah-TAH-suh-nuh", spoken: "oot kah tah suh nuh", english: "Chair Pose", emoji: "🪑", hook: "Think: ‘oof, cut a seat’—then sit back into your invisible chair.", cue: "Send hips back, keep weight in the heels and lengthen the spine." },
  { sanskrit: "Trikonasana", phonetic: "trik-con-AH-suh-nuh", spoken: "trick cone ah suh nuh", english: "Triangle Pose", emoji: "🔺", hook: "Tri-kona: three angles make a triangle.", cue: "Reach forward before tipping; stack the shoulders without collapsing the waist." },
  { sanskrit: "Vīrabhadrāsana II", phonetic: "veer-uh-buh-DRAH-suh-nuh two", spoken: "veer uh buh drah suh nuh two", english: "Warrior II", emoji: "🏹", hook: "Vīrabhadra is the fierce warrior; gaze calmly beyond the front hand.", cue: "Front knee tracks over toes; press through the back foot and soften the shoulders." },
  { sanskrit: "Adho Mukha Śvānāsana", phonetic: "AH-doh MOO-kah shvah-NAH-suh-nuh", spoken: "ah doh moo kah shvah nah suh nuh", english: "Downward-Facing Dog", emoji: "🐕", hook: "Adho = down, mukha = face, śvāna = dog.", cue: "Lift the sitting bones, lengthen the spine and let the heels be heavy—not forced." }
];

const GOAL = 8;
const saved = JSON.parse(localStorage.getItem("yoga-streak-state") || "{}");
const state = {
  xp: saved.xp || 0,
  streak: saved.streak || 0,
  lastComplete: saved.lastComplete || null,
  today: saved.today || null,
  todayCount: saved.today === dateKey() ? (saved.todayCount || 0) : 0,
  todayXp: saved.today === dateKey() ? (saved.todayXp || 0) : 0,
  hearts: 5,
  lessonIndex: 0,
  answered: false,
  questions: []
};

const $ = (id) => document.getElementById(id);
function dateKey(date = new Date()) { return date.toISOString().slice(0, 10); }
function yesterdayKey() { const d = new Date(); d.setDate(d.getDate() - 1); return dateKey(d); }
function save() {
  localStorage.setItem("yoga-streak-state", JSON.stringify({ xp: state.xp, streak: state.streak, lastComplete: state.lastComplete, today: dateKey(), todayCount: state.todayCount, todayXp: state.todayXp }));
}
function show(id) { document.querySelectorAll(".screen").forEach(s => s.classList.remove("active")); $(id).classList.add("active"); }
function shuffle(items) { return [...items].sort(() => Math.random() - .5); }
function updateDashboard() {
  $("streak").textContent = state.streak;
  $("xp").textContent = state.xp;
  $("hearts").textContent = state.hearts;
  $("goal-label").textContent = `${Math.min(state.todayCount, GOAL)} / ${GOAL}`;
  $("goal-progress").style.width = `${Math.min(100, state.todayCount / GOAL * 100)}%`;
  $("day-number").textContent = Math.max(1, state.streak + 1);
  $("start").firstChild.textContent = state.todayCount >= GOAL ? "Practise again " : state.todayCount ? "Continue today’s practice " : "Start today’s practice ";
}

function makeQuestions() {
  const questions = [];
  for (let i = 0; i < GOAL; i++) {
    const pose = POSES[i % POSES.length];
    const mode = i % 4;
    questions.push({ pose, mode });
  }
  return shuffle(questions);
}

function renderQuestion() {
  state.answered = false;
  const { pose, mode } = state.questions[state.lessonIndex];
  $("feedback").className = "feedback hidden";
  $("continue").classList.add("hidden");
  $("lesson-hearts").textContent = state.hearts;
  $("lesson-progress").style.width = `${state.lessonIndex / GOAL * 100}%`;
  let question, type, prompt, correct, alternatives;
  if (mode === 0) {
    type = "NAME THAT POSE"; question = "What is the Sanskrit name?";
    prompt = `<div><div class="pose-emoji">${pose.emoji}</div><strong>${pose.english}</strong></div>`;
    correct = pose.sanskrit; alternatives = POSES.filter(p => p !== pose).map(p => p.sanskrit);
  } else if (mode === 1) {
    type = "TRANSLATE"; question = "What does this pose name mean?";
    prompt = `<div><div class="sanskrit">${pose.sanskrit}</div><div class="phonetic">${pose.phonetic}</div><button class="speak" data-speak="${pose.sanskrit}">🔊 Hear it</button></div>`;
    correct = pose.english; alternatives = POSES.filter(p => p !== pose).map(p => p.english);
  } else if (mode === 2) {
    type = "MEMORY HOOK"; question = "Which memory hook belongs to this pose?";
    prompt = `<div><div class="sanskrit">${pose.sanskrit}</div><div>${pose.english}</div></div>`;
    correct = pose.hook; alternatives = POSES.filter(p => p !== pose).map(p => p.hook);
  } else {
    type = "TEACHING CUES"; question = `Choose the best cue for ${pose.english}.`;
    prompt = `<div><div class="pose-emoji">${pose.emoji}</div><strong>${pose.sanskrit}</strong></div>`;
    correct = pose.cue; alternatives = POSES.filter(p => p !== pose).map(p => p.cue);
  }
  $("question-type").textContent = type;
  $("question").textContent = question;
  $("prompt-card").innerHTML = prompt;
  const choices = shuffle([correct, ...shuffle(alternatives).slice(0, 2)]);
  $("answers").innerHTML = choices.map(c => `<button class="answer" data-answer="${encodeURIComponent(c)}">${c}</button>`).join("");
  $("answers").querySelectorAll(".answer").forEach(btn => btn.addEventListener("click", () => answer(btn, decodeURIComponent(btn.dataset.answer), correct, pose)));
  const speak = $("prompt-card").querySelector(".speak");
  if (speak) speak.addEventListener("click", () => pronounce(pose));
}

function answer(button, value, correct, pose) {
  if (state.answered) return;
  state.answered = true;
  const right = value === correct;
  document.querySelectorAll(".answer").forEach(b => {
    const val = decodeURIComponent(b.dataset.answer);
    if (val === correct) b.classList.add("correct");
    else if (b === button) b.classList.add("wrong");
    b.disabled = true;
  });
  if (right) { state.xp += 10; state.todayXp += 10; }
  else state.hearts = Math.max(0, state.hearts - 1);
  state.todayCount += 1;
  $("lesson-hearts").textContent = state.hearts;
  $("feedback").innerHTML = right ? `<strong>Beautiful! +10 XP</strong><br>${pose.hook}` : `<strong>Nearly—let’s make it stick.</strong><br>${pose.hook}`;
  $("feedback").className = `feedback${right ? "" : " wrong"}`;
  $("continue").classList.remove("hidden");
  save(); updateDashboard();
}

function nextQuestion() {
  state.lessonIndex++;
  if (state.lessonIndex >= GOAL) return completeLesson();
  renderQuestion();
}
function completeLesson() {
  if (state.lastComplete !== dateKey()) {
    state.streak = state.lastComplete === yesterdayKey() ? state.streak + 1 : 1;
    state.lastComplete = dateKey();
  }
  $("earned-xp").textContent = state.todayXp;
  save(); updateDashboard(); show("complete");
}
function pronounce(pose) {
  if (!("speechSynthesis" in window)) {
    alert("Pronunciation audio is not supported by this browser. Please open Yoga Streak in Safari.");
    return;
  }
  const synth = window.speechSynthesis;
  const utterance = new SpeechSynthesisUtterance(pose.spoken);
  const voices = synth.getVoices();
  const voice = voices.find(v => v.lang === "en-GB") || voices.find(v => v.lang.startsWith("en"));
  if (voice) utterance.voice = voice;
  utterance.lang = voice?.lang || "en-GB";
  utterance.rate = .72;
  utterance.pitch = 1;
  utterance.volume = 1;
  utterance.onerror = () => alert("Your device could not play the pronunciation. Check that Silent Mode is off, then try again in Safari.");
  synth.cancel();
  synth.resume();
  setTimeout(() => synth.speak(utterance), 80);
}
function startLesson() { state.hearts = 5; state.lessonIndex = 0; state.questions = makeQuestions(); show("lesson"); renderQuestion(); }
function renderLibrary() {
  $("pose-list").innerHTML = POSES.map(p => `<article class="pose-card"><div class="pose-title"><span>${p.emoji}</span><div><h3>${p.sanskrit}</h3><p>${p.english} · ${p.phonetic}</p></div></div><p><strong>Hook:</strong> ${p.hook}</p><p><strong>Cue:</strong> ${p.cue}</p><button class="speak" data-pose="${p.sanskrit}">🔊 Hear pronunciation</button></article>`).join("");
  $("pose-list").querySelectorAll("[data-pose]").forEach(btn => btn.addEventListener("click", () => pronounce(POSES.find(p => p.sanskrit === btn.dataset.pose))));
}

$("start").addEventListener("click", startLesson);
$("continue").addEventListener("click", nextQuestion);
$("close-lesson").addEventListener("click", () => { show("home"); updateDashboard(); });
$("library-button").addEventListener("click", () => show("library"));
$("back-home").addEventListener("click", () => show("home"));
$("finish").addEventListener("click", () => show("home"));
renderLibrary(); updateDashboard();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
