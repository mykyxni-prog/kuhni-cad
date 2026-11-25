// Изолированный модуль голосового управления My Kitchen Pro.
export function mountVoiceControls({ onCommand } = {}) {
  if (document.getElementById('mkpVoiceRoot')) return;
  const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  const root = document.createElement('section');
  root.id = 'mkpVoiceRoot';
  root.innerHTML = '<style>'+
    '#mkpVoiceRoot{position:fixed;right:16px;bottom:16px;z-index:10000;font:14px/1.4 system-ui,-apple-system,Segoe UI,sans-serif;color:#f2f4f1}'+
    '#mkpVoiceRoot *{box-sizing:border-box}'+
    '#mkpVoicePanel{width:min(310px,calc(100vw - 28px));background:#202723;border:1px solid #60705f;border-radius:13px;box-shadow:0 8px 30px #0007;padding:12px;margin-bottom:8px}'+
    '#mkpVoicePanel[hidden]{display:none}'+
    '#mkpVoiceTop{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;font-weight:750}'+
    '#mkpVoiceState{font-size:12px;color:#b8c3ba;min-height:34px;overflow-wrap:anywhere}'+
    '#mkpVoiceTranscript{font-size:13px;color:#fff;background:#151a17;border-radius:7px;padding:8px;margin-top:8px;min-height:34px;overflow-wrap:anywhere}'+
    '#mkpVoiceActions{display:flex;gap:7px;margin-top:9px}'+
    '#mkpVoiceActions button,#mkpVoiceToggle{border:1px solid #61705e;border-radius:8px;background:#303a33;color:#f2f4f1;padding:9px 11px;font:inherit;cursor:pointer}'+
    '#mkpVoiceActions button:disabled{opacity:.45;cursor:not-allowed}'+
    '#mkpVoiceStart{background:#8ac440!important;color:#17200f!important;font-weight:750;flex:1}'+
    '#mkpVoiceToggle{display:flex;align-items:center;gap:8px;background:#263128;border-color:#8ac440;box-shadow:0 5px 18px #0005;font-weight:750}'+
    '#mkpVoiceToggle .mic{font-size:19px}'+
    '#mkpVoiceClose{padding:2px 7px!important}'+
    '@media(max-width:560px){#mkpVoiceRoot{right:10px;bottom:10px}#mkpVoicePanel{width:min(300px,calc(100vw - 20px))}}'+
    '</style>'+
    '<div id="mkpVoicePanel" hidden><div id="mkpVoiceTop"><span>Голосовой помощник · тест</span><button id="mkpVoiceClose" type="button" aria-label="Закрыть">×</button></div>'+
    '<div id="mkpVoiceState">Нажми «Говорить» и произнеси команду.</div>'+
    '<div id="mkpVoiceTranscript">Например: «Создай вертикальную деталь 720 на 560 толщиной 16»</div>'+
    '<div id="mkpVoiceActions"><button id="mkpVoiceStart" type="button">🎙 Говорить</button><button id="mkpVoiceStop" type="button" disabled>Стоп</button></div></div>'+
    '<button id="mkpVoiceToggle" type="button"><span class="mic">🎙</span><span>Голос</span></button>';
  document.body.appendChild(root);
  const panel=root.querySelector('#mkpVoicePanel');
  const state=root.querySelector('#mkpVoiceState');
  const transcript=root.querySelector('#mkpVoiceTranscript');
  const start=root.querySelector('#mkpVoiceStart');
  const stop=root.querySelector('#mkpVoiceStop');
  const toggle=root.querySelector('#mkpVoiceToggle');
  const close=root.querySelector('#mkpVoiceClose');
  let recognition=null, listening=false;
  const setState=message=>{state.textContent=message;};
  toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;});
  close.addEventListener('click',()=>{if(listening)recognition?.stop();panel.hidden=true;});
  if(!SpeechAPI){
    setState('В этом браузере голосовое распознавание не поддерживается. Попробуй Chrome на компьютере.');
    start.disabled=true;
    toggle.title='Распознавание речи недоступно в этом браузере';
  }else{
    recognition=new SpeechAPI();
    recognition.lang='ru-RU';
    recognition.continuous=false;
    recognition.interimResults=true;
    recognition.maxAlternatives=1;
    recognition.onstart=()=>{listening=true;start.disabled=true;stop.disabled=false;setState('Слушаю… Говори одну команду.');};
    recognition.onresult=event=>{
      let interim='',finalText='';
      for(let i=event.resultIndex;i<event.results.length;i++){
        const phrase=event.results[i][0]?.transcript||'';
        if(event.results[i].isFinal)finalText+=phrase;else interim+=phrase;
      }
      if(interim)transcript.textContent=interim;
      if(finalText.trim()){
        const phrase=finalText.trim();
        transcript.textContent='«'+phrase+'»';
        try{
          const result=onCommand?.(phrase)||{ok:false,message:'Команда не обработана'};
          setState(result.message||(result.ok?'Команда выполнена':'Не удалось выполнить команду'));
        }catch(error){
          console.error('Voice command failed',error);
          setState('Ошибка команды: '+(error?.message||String(error)));
        }
      }
    };
    recognition.onerror=event=>{
      const messages={'not-allowed':'Разреши браузеру доступ к микрофону.','no-speech':'Речь не услышана. Попробуй ещё раз.','audio-capture':'Микрофон не найден.','network':'Ошибка распознавания речи: проверь подключение к интернету.'};
      setState(messages[event.error]||('Ошибка распознавания: '+event.error));
    };
    recognition.onend=()=>{listening=false;start.disabled=false;stop.disabled=true;};
    start.addEventListener('click',()=>{
      if(listening)return;
      transcript.textContent='Ожидаю команду…';
      try{recognition.start();}catch(error){setState('Не удалось включить микрофон: '+error.message);}
    });
    stop.addEventListener('click',()=>{if(listening)recognition.stop();});
  }
  return {destroy(){try{recognition?.stop();}catch{}root.remove();}};
}