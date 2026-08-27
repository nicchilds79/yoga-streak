const POSES = STANDING_POSES;

const GOAL = 8;
const saved = JSON.parse(localStorage.getItem("yoga-streak-state") || "{}");
const rotationSaved = JSON.parse(localStorage.getItem("yoga-pose-rotation") || "{}");
let poseQueue = Array.isArray(rotationSaved.queue) ? rotationSaved.queue.filter(name => POSES.some(p => p.sanskrit === name)) : [];
let lastLesson = Array.isArray(rotationSaved.lastLesson) ? rotationSaved.lastLesson : [];
const practiceScores = JSON.parse(localStorage.getItem("yoga-practice-scores") || "{}");
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
function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
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
  while (poseQueue.length < GOAL) {
    const queued = new Set(poseQueue);
    const unseen = POSES.filter(p => !queued.has(p.sanskrit));
    const fresh = unseen.filter(p => !lastLesson.includes(p.sanskrit));
    const recent = unseen.filter(p => lastLesson.includes(p.sanskrit));
    poseQueue.push(...shuffle(fresh), ...shuffle(recent));
  }
  const needsPractice = Object.entries(practiceScores)
    .filter(([name, score]) => score > 0 && POSES.some(p => p.sanskrit === name) && !lastLesson.includes(name))
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
  poseQueue = [...needsPractice, ...poseQueue.filter(name => !needsPractice.includes(name))];
  const lessonNames = poseQueue.splice(0, Math.min(GOAL, POSES.length));
  lastLesson = lessonNames;
  localStorage.setItem("yoga-pose-rotation", JSON.stringify({ queue: poseQueue, lastLesson }));
  const modes = shuffle(Array.from({ length: lessonNames.length }, (_, i) => i % 4));
  return lessonNames.map((name, index) => ({ pose: POSES.find(p => p.sanskrit === name), mode: modes[index] }));
}

function renderQuestion() {
  state.answered = false;
  const { pose, mode } = state.questions[state.lessonIndex];
  $("feedback").className = "feedback hidden";
  $("continue").classList.add("hidden");
  $("lesson-hearts").textContent = state.hearts;
  $("lesson-progress").style.width = `${state.lessonIndex / state.questions.length * 100}%`;
  let question, type, prompt, correct, alternatives;
  if (mode === 0) {
    type = "NAME THAT POSE"; question = "What is the Sanskrit name?";
    prompt = pose.image ? `<div><img class="quiz-pose-image" src="${pose.image}" alt="${pose.english}"><strong>${pose.english}</strong></div>` : `<div><div class="pose-emoji">${pose.emoji}</div><strong>${pose.english}</strong></div>`;
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
  if (right) practiceScores[pose.sanskrit] = Math.max(0, (practiceScores[pose.sanskrit] || 0) - 1);
  else {
    practiceScores[pose.sanskrit] = (practiceScores[pose.sanskrit] || 0) + 2;
    const current = state.questions[state.lessonIndex];
    const alreadyQueued = state.questions.slice(state.lessonIndex + 1).some(question => question.pose === pose && question.retry);
    if (!current.retry && !alreadyQueued) {
      const retryAt = Math.min(state.lessonIndex + 3, state.questions.length);
      state.questions.splice(retryAt, 0, { pose, mode: (current.mode + 1) % 4, retry: true });
    }
  }
  localStorage.setItem("yoga-practice-scores", JSON.stringify(practiceScores));
  state.todayCount += 1;
  $("lesson-hearts").textContent = state.hearts;
  $("feedback").innerHTML = right
    ? `<strong>${state.questions[state.lessonIndex].retry ? "That’s the one—it’s sticking! +10 XP" : "Beautiful! +10 XP"}</strong><br>${pose.hook}`
    : `<strong>Correct answer: ${correct}</strong><br>${pose.hook}<br><em>${pose.cue}</em><br><button class="speak feedback-speak">🔊 Hear ${pose.sanskrit}</button><small class="retry-note">You’ll see this pose again shortly.</small>`;
  $("feedback").className = `feedback${right ? "" : " wrong"}`;
  const feedbackSpeak = $("feedback").querySelector(".feedback-speak");
  if (feedbackSpeak) feedbackSpeak.addEventListener("click", () => pronounce(pose));
  $("continue").classList.remove("hidden");
  save(); updateDashboard();
}

function nextQuestion() {
  state.lessonIndex++;
  if (state.lessonIndex >= state.questions.length) return completeLesson();
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
  let currentFamily = "";
  $("pose-list").innerHTML = POSES.map((p, index) => {
    const heading = p.family !== currentFamily ? `<h3 class="family-heading">${currentFamily = p.family}</h3>` : "";
    const visual = p.image ? `<a class="pose-visual" href="${p.image}" target="_blank"><img src="${p.image}" alt="${p.english} alignment illustration" loading="lazy"><span>Tap to enlarge</span></a>` : "";
    return `${heading}<article class="pose-card"><button class="pose-summary" data-expand="${index}" aria-expanded="false"><span class="pose-symbol">${p.emoji}</span><span class="pose-copy"><strong class="pose-sanskrit">${p.sanskrit}</strong><span class="pose-english">${p.english}</span><span class="pose-pronunciation">${p.phonetic}</span></span><b>＋</b></button><div class="pose-details hidden" id="pose-details-${index}">${visual}<button class="speak" data-pose="${p.sanskrit}">🔊 Hear pronunciation</button><dl><dt>Muscle focus</dt><dd>${p.focus}</dd><dt>Aim of pose</dt><dd>${p.aim}</dd><dt>Benefits</dt><dd>${p.benefits}</dd><dt>Starting position</dt><dd>${p.start}</dd><dt>Action</dt><dd>${p.action}</dd><dt>Watchpoints</dt><dd>${p.watch}</dd><dt>Beginner modification</dt><dd>${p.beginner}</dd><dt>Advanced option</dt><dd>${p.advanced}</dd><dt>Contraindications</dt><dd>${p.contra}</dd><dt>Memory hook</dt><dd>${p.hook}</dd><dt>Teaching cue</dt><dd>${p.cue}</dd></dl></div></article>`;
  }).join("");
  $("pose-list").querySelectorAll("[data-expand]").forEach(btn => btn.addEventListener("click", () => {
    const details = $(`pose-details-${btn.dataset.expand}`);
    const opening = details.classList.contains("hidden");
    details.classList.toggle("hidden"); btn.setAttribute("aria-expanded", opening); btn.querySelector("b").textContent = opening ? "−" : "＋";
  }));
  $("pose-list").querySelectorAll("[data-pose]").forEach(btn => btn.addEventListener("click", () => pronounce(POSES.find(p => p.sanskrit === btn.dataset.pose))));
}

$("start").addEventListener("click", startLesson);
$("continue").addEventListener("click", nextQuestion);
$("close-lesson").addEventListener("click", () => { show("home"); updateDashboard(); });
$("library-button").addEventListener("click", () => show("library"));
$("back-home").addEventListener("click", () => show("home"));
$("finish").addEventListener("click", () => show("home"));
renderLibrary(); updateDashboard();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw-v8.js");
