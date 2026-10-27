(function () {
  'use strict';

  const subdivisionNames = { 1: 'negras', 2: 'corcheas', 3: 'tresillos', 4: 'semicorcheas' };

  function init(widget) {
    const bpmInput = widget.querySelector('[data-bpm]');
    const bpmRange = widget.querySelector('[data-bpm-range]');
    const meter = widget.querySelector('[data-meter]');
    const beatUnit = widget.querySelector('[data-beat-unit]');
    const subdivision = widget.querySelector('[data-subdivision]');
    const grid = widget.querySelector('[data-grid]');
    const caption = widget.querySelector('[data-grid-caption]');
    const status = widget.querySelector('[data-status]');
    const toggle = widget.querySelector('[data-toggle]');
    const buttonText = widget.querySelector('[data-button-text]');
    const buttonIcon = widget.querySelector('[data-button-icon]');

    let audio = null;
    let running = false;
    let timer = null;
    let nextTime = 0;
    let step = 0;
    let beatIndex = 0;
    let generation = 0;
    const lookAhead = 25;
    const scheduleAhead = 0.12;

    function beatsPerMeasure() {
      return meter.value === '6' && beatUnit.value === 'dotted' ? 2 : Number(meter.value);
    }
    function stepsPerMeasure() { return beatsPerMeasure() * Number(subdivision.value); }
    function secondsPerBeat() { return (60 / Number(bpmInput.value)) * (beatUnit.value === 'dotted' ? 1.5 : 1); }
    function secondsPerStep() { return secondsPerBeat() / Number(subdivision.value); }

    function paintGrid() {
      const dottedOption = beatUnit.querySelector('option[value="dotted"]');
      dottedOption.disabled = meter.value !== '6';
      if (meter.value !== '6' && beatUnit.value === 'dotted') beatUnit.value = 'quarter';
      const count = stepsPerMeasure();
      grid.replaceChildren();
      grid.style.setProperty('--rg-columns', count);
      for (let i = 0; i < count; i += 1) {
        const cell = document.createElement('span');
        cell.className = 'rguitar__step' + (i % Number(subdivision.value) === 0 ? ' rguitar__step--beat' : '') + (i === 0 ? ' rguitar__step--downbeat' : '');
        cell.dataset.step = String(i);
        cell.setAttribute('aria-hidden', 'true');
        grid.appendChild(cell);
      }
      const pulseUnit = beatUnit.value === 'dotted' ? 'negra con puntillo' : 'negra';
      caption.textContent = `${beatsPerMeasure()} pulsos · ${count} pasos`;
      grid.setAttribute('aria-label', `${meter.value}/${meter.value === '6' ? '8' : '4'}, ${beatsPerMeasure()} pulsos de ${pulseUnit}, ${subdivisionNames[subdivision.value]}`);
    }

    function setStatus(text, active) {
      status.textContent = text;
      status.classList.toggle('is-playing', Boolean(active));
    }

    function syncButton() {
      buttonText.textContent = running ? 'Parar' : 'Empezar';
      buttonIcon.textContent = running ? '■' : '▶';
      toggle.setAttribute('aria-pressed', String(running));
    }

    function setBpm(value) {
      const parsed = Math.min(240, Math.max(30, Math.round(Number(value) || 90)));
      bpmInput.value = parsed;
      bpmRange.value = parsed;
    }

    function update() {
      setBpm(bpmInput.value);
      paintGrid();
      if (running) reschedule();
    }

    function reschedule() {
      stop();
      start();
    }

    function clearHighlights() {
      grid.querySelectorAll('.is-active').forEach((cell) => cell.classList.remove('is-active'));
    }

    function stop() {
      running = false;
      generation += 1;
      if (timer !== null) window.clearInterval(timer);
      timer = null;
      clearHighlights();
      setStatus('Listo para practicar', false);
      syncButton();
    }

    function clickSound(time, accented, primary) {
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(accented ? 1320 : (primary ? 940 : 690), time);
      gain.gain.setValueAtTime(0.0001, time);
      gain.gain.exponentialRampToValueAtTime(accented ? 0.34 : (primary ? 0.19 : 0.095), time + 0.003);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);
      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.start(time);
      oscillator.stop(time + 0.05);
    }

    function scheduleVisual(index, time, runId, primary) {
      const delay = Math.max(0, (time - audio.currentTime) * 1000);
      window.setTimeout(() => {
        if (!running || generation !== runId) return;
        clearHighlights();
        const cell = grid.querySelector(`[data-step="${index}"]`);
        if (cell) cell.classList.add('is-active');
        const beat = Math.floor(index / Number(subdivision.value)) + 1;
        setStatus(primary ? `Pulso ${beat} de ${beatsPerMeasure()}` : `Subdivisión ${index + 1}`, true);
      }, delay);
    }

    function scheduler() {
      while (nextTime < audio.currentTime + scheduleAhead) {
        const currentStep = step;
        const primary = currentStep % Number(subdivision.value) === 0;
        const accented = primary && beatIndex === 0;
        clickSound(nextTime, accented, primary);
        scheduleVisual(currentStep, nextTime, generation, primary);
        step += 1;
        if (step >= stepsPerMeasure()) step = 0;
        beatIndex = Math.floor(step / Number(subdivision.value));
        nextTime += secondsPerStep();
      }
    }

    async function start() {
      if (running) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        setStatus('Este navegador no admite audio web', false);
        return;
      }
      audio = audio || new AudioContext();
      if (audio.state === 'suspended') await audio.resume();
      running = true;
      step = 0;
      beatIndex = 0;
      nextTime = audio.currentTime + 0.06;
      generation += 1;
      setStatus('Preparando el primer pulso…', true);
      syncButton();
      scheduler();
      timer = window.setInterval(scheduler, lookAhead);
    }

    bpmInput.addEventListener('change', () => { setBpm(bpmInput.value); if (running) reschedule(); });
    bpmInput.addEventListener('input', () => { setBpm(bpmInput.value); if (running) reschedule(); });
    bpmRange.addEventListener('input', () => { setBpm(bpmRange.value); if (running) reschedule(); });
    meter.addEventListener('change', () => {
      if (meter.value === '6') beatUnit.value = 'dotted';
      else beatUnit.value = 'quarter';
      update();
    });
    [beatUnit, subdivision].forEach((control) => control.addEventListener('change', update));
    toggle.addEventListener('click', () => { if (running) stop(); else start(); });
    paintGrid();
    syncButton();
  }

  document.querySelectorAll('[data-rguitar]').forEach(init);
}());


