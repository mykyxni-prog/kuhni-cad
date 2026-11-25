// Изолированный голосовой интерфейс My Kitchen Pro: одна кнопка-микрофон.
export function mountVoiceControls({ onCommand } = {}) {
  if (document.getElementById('mkpVoiceRoot')) return;
  const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  const root = document.createElement('div');
  root.id = 'mkpVoiceRoot';
  root.innerHTML = '<style>'+
    '#mkpVoiceRoot{position:fixed;right:18px;bottom:18px;z-index:10000}'+
    '#mkpVoiceMic{width:58px;height:58px;border-radius:50%;border:2px solid #8ac440;background:#263128;color:#fff;box-shadow:0 5px 20px #0008;display:grid;place-items:center;font:26px system-ui;cursor:pointer;touch-action:manipulation}'+
    '#mkpVoiceMic.listening{background:#8ac440;color:#17200f;animation:mkpPulse 1.2s infinite}'+
    '#mkpVoiceMic:disabled{opacity:.55;cursor:not-allowed}'+
    '#mkpVoiceStatus{position:absolute;right:0;bottom:66px;white-space:nowrap;max-width:min(260px,80vw);overflow:hidden;text-overflow:ellipsis;background:#202723;color:#f2f4f1;border:1px solid #60705f;border-radius:8px;padding:6px 9px;font:12px system-ui;display:none}'+
    '#mkpVoiceStatus.show{display:block}'+
    '@keyframes mkpPulse{50%{box-shadow:0 0 0 9px #8ac44033,0 5px 20px #0008}}'+
    '</style><div id="mkpVoiceStatus" role="status"></div><button id="mkpVoiceMic" type="button" aria-label="Нажми, чтобы говорить" title="Нажми, чтобы говорить">🎙</button>';
  document.body.appendChild(root);
  const mic=root.querySelector('#mkpVoiceMic');
  const status=root.querySelector('#mkpVoiceStatus');
  let recognition=null, listening=false, hideStatusTimer=null;
  const show=(message)=>{
    status.textContent=message;
    status.classList.add('show');
    clearTimeout(hideStatusTimer);
    hideStatusTimer=setTimeout(()=>status.classList.remove('show'),3500);
  };
  const setListening=(value)=>{
    listening=value;
    mic.classList.toggle('listening',value);
    mic.textContent=value?'■':'🎙';
    mic.setAttribute('aria-label',value?'Остановить прослушивание':'Нажми, чтобы говорить');
    mic.title=value?'Нажми, чтобы остановить':'Нажми, чтобы говорить';
  };
  if(!SpeechAPI){
    mic.disabled=true;
    show('Голосовое распознавание недоступно. Открой в Chrome.');
  }else{
    recognition=new SpeechAPI();
    recognition.lang='ru-RU';
    recognition.continuous=false;
    recognition.interimResults=false;
    recognition.maxAlternatives=1;
    recognition.onstart=()=>{setListening(true);show('Слушаю…');};
    recognition.onresult=(event)=>{
      const phrase=(event.results?.[event.resultIndex]?.[0]?.transcript||'').trim();
      if(!phrase)return;
      show('Понял: '+phrase);
      try{
        const result=onCommand?.(phrase)||{ok:false,message:'Не понял команду'};
        if(result.message)show(result.message);
      }catch(error){
        console.error('Voice command failed',error);
        show('Ошибка: '+(error?.message||String(error)));
      }
    };
    recognition.onerror=(event)=>{
      const messages={'not-allowed':'Разреши доступ к микрофону.','no-speech':'Не услышал речь. Нажми и попробуй ещё раз.','audio-capture':'Микрофон не найден.','network':'Ошибка распознавания. Проверь интернет.'};
      show(messages[event.error]||('Ошибка микрофона: '+event.error));
    };
    recognition.onend=()=>setListening(false);
    mic.addEventListener('click',()=>{
      if(listening){try{recognition.stop();}catch{};return;}
      try{recognition.start();}catch(error){show('Не удалось включить микрофон: '+error.message);}
    });
  }
  return {destroy(){try{recognition?.stop();}catch{};clearTimeout(hideStatusTimer);root.remove();}};
}
