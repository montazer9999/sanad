(function () {
  'use strict';
  var KEY = 'sanad_teacher_platform_v3';
  var state = null;
  function read() {
    try { state = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { state = {}; }
    if (!Array.isArray(state.examQuestions)) state.examQuestions = [];
    if (!Array.isArray(state.questionBank)) state.questionBank = [];
    if (!Array.isArray(state.savedExams)) state.savedExams = [];
    return state;
  }
  function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
  function esc(v) { return String(v == null ? '' : v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
  function el(id) { return document.getElementById(id); }
  function typeName(t) { return ({essay:'مقالي / تعليل',multiple:'اختيار من متعدد',truefalse:'صح أو خطأ',fill:'أكمل الفراغ',definition:'تعريفات',problem:'مسألة حسابية'})[t] || 'سؤال'; }
  function answerName(t) { return ({lines:'أسطر منظمة',blank:'إطار فارغ',grid:'شبكة مربعات',none:'بدون مساحة'})[t] || 'أسطر منظمة'; }
  function injectStyles() {
    var css = '.exam-studio{background:radial-gradient(circle at 10% 0%,rgba(14,165,233,.22),transparent 32%),linear-gradient(135deg,#07142e,#102d66 52%,#07142e);border:1px solid rgba(96,165,250,.35);box-shadow:0 18px 55px rgba(2,8,23,.35)}.exam-studio-card{background:linear-gradient(145deg,rgba(15,35,75,.96),rgba(8,18,40,.96));border:1px solid rgba(96,165,250,.22);border-radius:18px}.exam-studio-btn{border:1px solid rgba(96,165,250,.35);background:rgba(30,64,175,.22);border-radius:10px;padding:7px 11px;font-weight:800;font-size:11px}.exam-studio-btn:hover{background:rgba(37,99,235,.4)}.exam-studio-preview{background:#fff;color:#111827;border-radius:14px;padding:18px;box-shadow:inset 0 1px 4px #cbd5e1}.exam-studio-preview .exam-q{break-inside:avoid;margin:0 0 16px}.exam-studio-field{width:100%;background:#071225;border:1px solid #29436d;border-radius:10px;padding:9px;color:#fff}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  }
  function addComposerFields() {
    var modal = el('modalAddQuestion');
    if (!modal || el('studioQuestionType')) return;
    var title = el('newQTitleInput');
    var wrap = document.createElement('div');
    wrap.className = 'grid grid-cols-1 sm:grid-cols-2 gap-3';
    wrap.innerHTML = '<div><label class="block font-bold text-slate-300 mb-1" for="studioQuestionType">نوع السؤال</label><select id="studioQuestionType" class="exam-studio-field"><option value="essay">مقالي / تعليل</option><option value="multiple">اختيار من متعدد</option><option value="truefalse">صح أو خطأ</option><option value="fill">أكمل الفراغ</option><option value="definition">تعريفات</option><option value="problem">مسألة حسابية</option></select></div><div><label class="block font-bold text-slate-300 mb-1" for="studioAnswerStyle">مساحة الإجابة</label><select id="studioAnswerStyle" class="exam-studio-field"><option value="lines">أسطر منظمة</option><option value="blank">إطار فارغ</option><option value="grid">شبكة مربعات</option><option value="none">بدون مساحة</option></select></div>';
    if (title && title.parentNode) title.parentNode.parentNode.insertBefore(wrap, title.parentNode);
  }
  function insertStudio() {
    var view = el('viewExams');
    if (!view || el('examStudioRoot')) return;
    var root = document.createElement('div');
    root.id = 'examStudioRoot';
    root.className = 'space-y-4';
    root.innerHTML =
      '<section class="exam-studio rounded-3xl p-5 sm:p-7 space-y-5 relative overflow-hidden">' +
        '<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4"><div><span class="text-cyan-200 text-xs font-black tracking-widest">SANAD EXAM STUDIO</span><h2 class="text-xl sm:text-2xl font-black text-white mt-1">استوديو صناعة الأسئلة والامتحانات</h2><p class="text-blue-100/75 text-xs mt-2">صناعة أسئلة متنوعة، بنك أسئلة، مسودات محفوظة، ومعاينة فورية قبل الطباعة.</p></div><div class="flex flex-wrap gap-2"><button id="studioSaveDraft" class="px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 text-xs font-black">حفظ الامتحان</button><button id="studioPrint" class="px-4 py-2.5 rounded-xl bg-sky-400 text-slate-950 text-xs font-black">طباعة / PDF</button></div></div>' +
        '<div class="grid grid-cols-2 md:grid-cols-4 gap-3"><div class="bg-black/20 border border-white/10 rounded-2xl p-3"><span class="text-blue-100/70 text-[11px]">الأسئلة الحالية</span><strong id="studioCount" class="block text-2xl text-white">0</strong></div><div class="bg-black/20 border border-white/10 rounded-2xl p-3"><span class="text-blue-100/70 text-[11px]">مجموع الدرجات</span><strong id="studioMarks" class="block text-2xl text-amber-300">0</strong></div><div class="bg-black/20 border border-white/10 rounded-2xl p-3"><span class="text-blue-100/70 text-[11px]">بنك الأسئلة</span><strong id="studioBankCount" class="block text-2xl text-cyan-200">0</strong></div><div class="bg-black/20 border border-white/10 rounded-2xl p-3"><span class="text-blue-100/70 text-[11px]">المعاينة</span><strong class="block text-sm text-emerald-300 mt-2">تحديث مباشر</strong></div></div>' +
      '</section>' +
      '<div class="grid grid-cols-1 xl:grid-cols-2 gap-4"><section class="exam-studio-card p-4 space-y-3"><div class="flex justify-between items-center"><h3 class="font-black text-white">بنك الأسئلة</h3><span class="text-[10px] text-cyan-200">احفظ السؤال وأعد استخدامه</span></div><div id="studioBank" class="space-y-2 max-h-64 overflow-y-auto"></div></section><section class="exam-studio-card p-4 space-y-3"><div class="flex justify-between items-center"><h3 class="font-black text-white">الامتحانات المحفوظة</h3><span class="text-[10px] text-cyan-200">مسودات قابلة للاسترجاع</span></div><div id="studioDrafts" class="space-y-2 max-h-64 overflow-y-auto"></div></section></div>' +
      '<section class="exam-studio-card p-4 sm:p-5 space-y-3"><div class="flex justify-between items-center"><h3 class="font-black text-white">معاينة ورقة الطالب</h3><span class="text-[10px] text-emerald-300">Live Preview</span></div><div id="studioPreview" class="exam-studio-preview" dir="rtl"></div></section>';
    var heading = view.querySelector('.luxury-card');
    if (heading) view.insertBefore(root, heading.nextSibling); else view.insertBefore(root, view.firstChild);
  }
  function getQuestions() { return read().examQuestions; }
  function answerHtml(q) {
    if (q.answerStyle === 'none') return '';
    if (q.answerStyle === 'blank') return '<div style="height:76px;border:1px solid #9ca3af;margin:8px 0 0"></div>';
    if (q.answerStyle === 'grid') return '<div style="height:86px;border:1px solid #9ca3af;margin:8px 0 0;background-image:linear-gradient(#e5e7eb 1px,transparent 1px),linear-gradient(90deg,#e5e7eb 1px,transparent 1px);background-size:15px 15px"></div>';
    return '<div style="margin-top:7px">' + [1,2,3].map(function(){return '<div style="height:22px;border-bottom:1px dashed #9ca3af"></div>';}).join('') + '</div>';
  }
  function refresh() {
    var s=read(), qs=s.examQuestions, bank=s.questionBank, drafts=s.savedExams;
    var total=qs.reduce(function(n,q){return n+(Number(q.marks)||0);},0);
    if(el('studioCount')) el('studioCount').textContent=qs.length;
    if(el('studioMarks')) el('studioMarks').textContent=total;
    if(el('studioBankCount')) el('studioBankCount').textContent=bank.length;
    if(el('studioBank')) el('studioBank').innerHTML=bank.length?bank.map(function(q){return '<div class="flex items-center justify-between gap-2 bg-black/20 border border-white/10 rounded-xl p-2.5"><div class="min-w-0"><div class="text-xs text-white font-bold truncate">'+esc(q.title)+'</div><div class="text-[10px] text-slate-400">'+esc(typeName(q.type))+' · '+(Number(q.marks)||0)+' درجة</div></div><div class="flex gap-1 shrink-0"><button class="exam-studio-btn text-emerald-200" data-bank-add="'+q.id+'">إضافة</button><button class="exam-studio-btn text-rose-300" data-bank-delete="'+q.id+'">حذف</button></div></div>';}).join(''):'<div class="text-xs text-slate-400 text-center py-5">لا توجد أسئلة محفوظة في البنك.</div>';
    if(el('studioDrafts')) el('studioDrafts').innerHTML=drafts.length?drafts.map(function(d){return '<div class="flex items-center justify-between gap-2 bg-black/20 border border-white/10 rounded-xl p-2.5"><div class="min-w-0"><div class="text-xs text-white font-bold truncate">'+esc(d.name)+'</div><div class="text-[10px] text-slate-400">'+esc(d.subject)+' · '+(d.questions||[]).length+' سؤال</div></div><button class="exam-studio-btn text-cyan-200" data-draft-open="'+d.id+'">فتح</button></div>';}).join(''):'<div class="text-xs text-slate-400 text-center py-5">لم تحفظ امتحانات بعد.</div>';
    var preview=el('studioPreview');
    if(preview) {
      var teacher=s.teacher||{};
      var header='<div style="text-align:center;border-bottom:2px solid #111827;padding-bottom:10px;margin-bottom:16px"><div style="font-weight:900">جمهورية العراق · وزارة التربية</div><div style="font-size:12px">'+esc(teacher.school||'اسم المدرسة')+'</div><div style="font-weight:900;margin-top:7px">'+esc(el('examTypeSelect')?el('examTypeSelect').value:'الامتحان')+' — '+esc(el('examSubjectInput')?el('examSubjectInput').value:teacher.subject)+'</div><div style="font-size:12px">'+esc(el('examGradeInput')?el('examGradeInput').value:'الصف')+' · الوقت: '+esc(el('examTimeInput')?el('examTimeInput').value:'')+'</div></div>';
      preview.innerHTML=qs.length?header+qs.map(function(q){return '<div class="exam-q"><div style="display:flex;justify-content:space-between;gap:12px;font-weight:900"><span>'+esc(q.qNum)+' — '+esc(q.title)+'</span><span style="white-space:nowrap">('+ (Number(q.marks)||0)+' درجة)</span></div><div style="font-size:13px;padding-right:14px;margin-top:5px">'+(q.branches||[]).map(function(b){return '<div style="margin:3px 0">'+esc(b)+'</div>';}).join('')+'</div>'+answerHtml(q)+'</div>';}).join('')+'<div style="border-top:1px solid #9ca3af;padding-top:8px;text-align:left;font-weight:900;font-size:12px">المجموع: '+total+' درجة</div>':'<div style="text-align:center;color:#64748b;padding:32px 8px;font-size:12px">أضف سؤالاً لتظهر معاينة ورقة الامتحان هنا.</div>';
    }
  }
  function saveDraft() {
    var name=prompt('اسم الامتحان الذي تريد حفظه:','امتحان '+(el('examSubjectInput')?el('examSubjectInput').value:'جديد'));
    if(!name) return;
    var s=read();
    s.savedExams.unshift({id:Date.now(),name:name,subject:el('examSubjectInput')?el('examSubjectInput').value:'',grade:el('examGradeInput')?el('examGradeInput').value:'',type:el('examTypeSelect')?el('examTypeSelect').value:'',time:el('examTimeInput')?el('examTimeInput').value:'',questions:JSON.parse(JSON.stringify(s.examQuestions)),savedAt:new Date().toISOString()});
    save(); refresh(); if(window.showToast) showToast('تم حفظ مسودة الامتحان','success');
  }
  function printExam() {
    var s=read(), t=s.teacher||{}, qs=s.examQuestions, total=qs.reduce(function(n,q){return n+(Number(q.marks)||0);},0);
    var subject=el('examSubjectInput')?el('examSubjectInput').value:(t.subject||''), grade=el('examGradeInput')?el('examGradeInput').value:'', type=el('examTypeSelect')?el('examTypeSelect').value:'', time=el('examTimeInput')?el('examTimeInput').value:'';
    var box=el('printContainer'); if(!box) return;
    box.innerHTML='<div style="padding:22px;font-family:Arial,sans-serif;direction:rtl;color:#111;line-height:1.7"><div style="display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:12px;text-align:center;font-size:13px;font-weight:bold"><div style="text-align:right">جمهورية العراق<br>وزارة التربية<br>'+esc(t.school||'')+'</div><div>بسم الله الرحمن الرحيم<br>'+esc(type)+'<br>العام الدراسي: 2026–2027</div><div style="text-align:left">المادة: '+esc(subject)+'<br>الصف: '+esc(grade)+'<br>الوقت: '+esc(time)+'</div></div><div style="display:flex;justify-content:space-between;margin:12px 0;font-size:12px"><span>اسم الطالب: ....................................</span><span>الشعبة: ............</span></div>'+qs.map(function(q){return '<div style="margin:0 0 16px;break-inside:avoid"><div style="display:flex;justify-content:space-between;gap:12px;font-weight:900;border-bottom:1px dotted #aaa;padding-bottom:4px"><span>'+esc(q.qNum)+' — '+esc(q.title)+'</span><span>('+ (Number(q.marks)||0)+' درجة)</span></div><div style="padding-right:14px;font-size:13px">'+(q.branches||[]).map(function(b){return '<div style="margin-top:5px">'+esc(b)+'</div>';}).join('')+'</div>'+answerHtml(q)+'</div>';}).join('')+'<div style="border-top:1px solid #111;padding-top:10px;margin-top:25px;display:flex;justify-content:space-between;font-size:12px;font-weight:bold"><span>تمنياتنا لكم بالنجاح والتفوق</span><span>المجموع: '+total+' درجة</span><span>معلم المادة: '+esc(t.name||'')+'</span></div></div>';
    window.print();
  }
  function handleActions(e) {
    var b=e.target.closest('[data-bank-add],[data-bank-delete],[data-draft-open]');
    if(!b) return;
    var s=read();
    if(b.hasAttribute('data-bank-add')) {
      var q=s.questionBank.find(function(x){return String(x.id)===b.getAttribute('data-bank-add');});
      if(q){s.examQuestions.push(Object.assign({},q,{id:Date.now(),qNum:'س '+(s.examQuestions.length+1)}));save();if(window.renderExamQuestions)window.renderExamQuestions();refresh();}
    } else if(b.hasAttribute('data-bank-delete')) {
      s.questionBank=s.questionBank.filter(function(x){return String(x.id)!==b.getAttribute('data-bank-delete');});save();refresh();
    } else {
      var d=s.savedExams.find(function(x){return String(x.id)===b.getAttribute('data-draft-open');});
      if(d){s.examQuestions=JSON.parse(JSON.stringify(d.questions||[]));save();if(el('examSubjectInput'))el('examSubjectInput').value=d.subject||'';if(el('examGradeInput'))el('examGradeInput').value=d.grade||'';if(el('examTypeSelect'))el('examTypeSelect').value=d.type||'';if(el('examTimeInput'))el('examTimeInput').value=d.time||'';if(window.renderExamQuestions)window.renderExamQuestions();refresh();}
    }
  }
  function attach() {
    read(); injectStyles(); insertStudio(); addComposerFields();
    if(el('studioSaveDraft'))el('studioSaveDraft').addEventListener('click',saveDraft);
    if(el('studioPrint'))el('studioPrint').addEventListener('click',printExam);
    document.addEventListener('click',handleActions);
    document.addEventListener('input',function(e){if(e.target.closest('#viewExams'))refresh();});
    var add=el('saveNewQuestionBtn');
    if(add)add.addEventListener('click',function(){
      var type=el('studioQuestionType')?el('studioQuestionType').value:'essay';
      var answer=el('studioAnswerStyle')?el('studioAnswerStyle').value:'lines';
      setTimeout(function(){
        var s=read(), q=s.examQuestions[s.examQuestions.length-1];
        if(q){q.type=type;q.answerStyle=answer;save();if(window.renderExamQuestions)window.renderExamQuestions();refresh();}
      },0);
    });
    refresh();
  }
  window.addEventListener('load',function(){attach();});
  window.addEventListener('storage',function(){read();refresh();});
})();