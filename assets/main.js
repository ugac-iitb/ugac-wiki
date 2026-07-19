var pages = [
  'home',
  'content',
  'resources',

  'policy-newsletter',
  'dues',
  'fast-track-degree',
  'rejoining-procedure',

  'idddp',
  'idddp-eligibility',
  'idddp-application',
  'idddp-selection',
  'idddp-departments',
  'idddp-prerequisites',
  'idddp-minor',
  'idddp-procedure',
  'idddp-retagging',
  'idddp-links',
  'idddp-reviews',

  'grad',
  'grad-getting-started',
  'grad-research-interests',
  'grad-univ-hunt',
  'grad-profile',
  'grad-application',

  'contact'
];
  var pendingAnchor = null;
 
  // ---------- Theme (defaults to dark) ----------
  function applyTheme(t){
    document.documentElement.setAttribute('data-theme', t);
    var btn = document.getElementById('themeBtn');
    if(btn){ btn.textContent = (t==='dark' ? '☀️' : '🌙'); btn.title = (t==='dark' ? 'Switch to light mode' : 'Switch to dark mode'); }
  }
  function toggleTheme(){
    var cur = document.documentElement.getAttribute('data-theme')==='dark' ? 'dark' : 'light';
    var next = cur==='dark' ? 'light' : 'dark';
    try{ localStorage.setItem('ugwiki-theme', next); }catch(e){}
    applyTheme(next);
  }
  (function(){
    var saved = 'light';
    try{ saved = localStorage.getItem('ugwiki-theme') || 'light'; }catch(e){}
    applyTheme(saved);
  })();
 
  function setActiveNav(page){
    document.querySelectorAll('nav.links a').forEach(function(a){
      a.classList.toggle('active', a.getAttribute('data-nav')===page);
    });
  }
 
  
 
  // go(page, [section], [subAnchor], event)  -- flexible args
  var PAGE_URLS = {
    'home': 'index.html',
    'content': 'content.html',
    'resources': 'resources.html',
    'policy-newsletter': 'policy-newsletter.html',
    'dues': 'dues.html',
    'fast-track-degree': 'fast-track-degree.html',
    'rejoining-procedure': 'rejoining-procedure.html',
    'idddp': 'idddp.html',
    'idddp-eligibility': 'idddp-eligibility.html',
    'idddp-application': 'idddp-application.html',
    'idddp-selection': 'idddp-selection.html',
    'idddp-departments': 'idddp-departments.html',
    'idddp-prerequisites': 'idddp-prerequisites.html',
    'idddp-minor': 'idddp-minor.html',
    'idddp-procedure': 'idddp-procedure.html',
    'idddp-retagging': 'idddp-retagging.html',
    'idddp-links': 'idddp-links.html',
    'idddp-reviews': 'idddp-reviews.html',
    'grad': 'grad.html',
    'grad-getting-started': 'grad-getting-started.html',
    'grad-research-interests': 'grad-research-interests.html',
    'grad-univ-hunt': 'grad-univ-hunt.html',
    'grad-profile': 'grad-profile.html',
    'grad-application': 'grad-application.html',
    'contact': 'contact.html'
  };

  function go(page){
    var args = Array.prototype.slice.call(arguments,1);
    var evt = null, anchor = null;
    args.forEach(function(a){
      if(a && a.preventDefault) evt = a;
      else if(typeof a === 'string') anchor = a;
    });
    if(evt) evt.preventDefault();

    var filename = PAGE_URLS[page] || 'index.html';
    var currentPath = window.location.pathname;
    var currentFilename = currentPath.substring(currentPath.lastIndexOf('/') + 1) || 'index.html';

    // Handle root path /
    if (currentFilename === '' || currentFilename === '/') {
      currentFilename = 'index.html';
    }

    if (currentFilename === filename) {
      if(page==='home' && !anchor) window.scrollTo({top:0,behavior:'auto'});
      if(anchor){
        scrollTo2(anchor);
      } else {
        window.scrollTo({top:0,behavior:'auto'});
      }
    } else {
      window.location.href = filename + (anchor ? '#' + anchor : '');
    }
    return false;
  }
 
  function scrollTo2(id){
    if(isReviewSectionId(id)){
      enterReviewsFullscreen();
      requestAnimationFrame(function(){
        renderReviewList();
        if(id === 'reviews'){
          var panel = document.querySelector('.reviews-list-panel');
          if(panel) panel.scrollTop = 0;
        } else {
          loadFirstReviewOfSection(id);
          scrollReviewListTo(id);
        }
      });
      return;
    }
    var el = document.getElementById(id);
    if(el){ el.scrollIntoView({behavior:'smooth', block:'start'}); }
  }
 
  /* ---------- Search ---------- */
  var SEARCH_INDEX = SEARCH_INDEX || [], SEARCH_RESULTS = [], searchHL = -1;
 
  
 
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function escapeReg(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
  function highlight(text, terms){
    var out = escapeHtml(text);
    var valid = terms.filter(function(t){ return t; }).sort(function(a,b){ return b.length - a.length; });
    if(!valid.length) return out;
    var re = new RegExp('(' + valid.map(escapeReg).join('|') + ')', 'ig');
    return out.replace(re, '<mark>$1</mark>');
  }
  function makeSnippet(text, terms){
    if(!text) return '';
    var low = text.toLowerCase(), pos = -1;
    terms.forEach(function(t){ var p = low.indexOf(t); if(p>=0 && (pos<0 || p<pos)) pos = p; });
    if(pos<0) return '';
    var start = Math.max(0, pos-30), snip = text.slice(start, start+120).replace(/\s+/g,' ').trim();
    if(start>0) snip = '… ' + snip;
    if(start+120 < text.length) snip = snip + ' …';
    return highlight(snip, terms);
  }
 
  function runSearch(q){
    var box = document.getElementById('searchResults');
    q = (q||'').trim().toLowerCase();
    if(q.length < 2){ closeSearch(false); return; }
    var terms = q.split(/\s+/);
    // Ignore common filler words so e.g. "what is a minor" matches on "minor"
    var stop = {'a':1,'an':1,'the':1,'is':1,'are':1,'of':1,'to':1,'in':1,'on':1,'for':1,'and':1,'or':1,
      'what':1,'why':1,'how':1,'do':1,'does':1,'i':1,'my':1,'me':1,'can':1,'should':1,'up':1,'take':1};
    var keep = terms.filter(function(t){ return !stop[t]; });
    if(keep.length) terms = keep;
    var scored = [];
    SEARCH_INDEX.forEach(function(it){
      var titleL = it.title.toLowerCase(), hay = (it.title + ' ' + it.text).toLowerCase();
      if(!terms.every(function(t){ return hay.indexOf(t) >= 0; })) return;
      var score = 0;
      terms.forEach(function(t){ if(titleL.indexOf(t) >= 0) score += 10; if(titleL.indexOf(t) === 0) score += 6; });
      scored.push({it:it, score:score});
    });
    scored.sort(function(a,b){ return b.score - a.score; });
    scored = scored.slice(0,8);
    SEARCH_RESULTS = scored.map(function(s){ return s.it; });
    searchHL = -1;
    if(!scored.length){
      box.innerHTML = '<div class="search-empty">No matches for &ldquo;' + escapeHtml(q) + '&rdquo;.</div>';
      box.classList.add('open'); return;
    }
    box.innerHTML = scored.map(function(s, i){
      var it = s.it, snip = makeSnippet(it.text, terms);
      return '<a href="#" data-i="' + i + '" onmousedown="event.preventDefault()" onclick="searchPick(' + i + ',event)">'
        + '<div class="sr-t">' + highlight(it.title, terms) + '</div>'
        + '<div class="sr-c">' + escapeHtml(it.crumb) + '</div>'
        + (snip ? '<div class="sr-s">' + snip + '</div>' : '')
        + '</a>';
    }).join('');
    box.classList.add('open');
  }
 
  function searchPick(i, evt){
    if(evt) evt.preventDefault();
    var it = SEARCH_RESULTS[i];
    if(!it) return;
    var inp = document.getElementById('searchInput');
    if(inp){ inp.value = ''; inp.blur(); }
    closeSearch(false);
    if(it.id) go(it.page, it.id); else go(it.page);
  }
 
  function searchKey(evt){
    var box = document.getElementById('searchResults');
    var items = box.querySelectorAll('a');
    if(evt.key === 'Escape'){ closeSearch(true); return; }
    if(!items.length) return;
    if(evt.key === 'ArrowDown'){ evt.preventDefault(); searchHL = Math.min(items.length-1, searchHL+1); }
    else if(evt.key === 'ArrowUp'){ evt.preventDefault(); searchHL = Math.max(0, searchHL-1); }
    else if(evt.key === 'Enter'){ evt.preventDefault(); searchPick(searchHL >= 0 ? searchHL : 0); return; }
    else return;
    items.forEach(function(a, i){ a.classList.toggle('hl', i === searchHL); if(i === searchHL) a.scrollIntoView({block:'nearest'}); });
  }
 
  function closeSearch(clearInput){
    var box = document.getElementById('searchResults');
    if(box){ box.classList.remove('open'); box.innerHTML = ''; }
    searchHL = -1;
    if(clearInput){ var inp = document.getElementById('searchInput'); if(inp){ inp.value = ''; inp.blur(); } }
  }
 
  document.addEventListener('click', function(e){
    var s = document.getElementById('search');
    if(s && !s.contains(e.target)) closeSearch(false);
  });

  /* ---------- Reviews ---------- */
  var reviews = [
    { name: 'Saukya Telge', department: 'Aerospace Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/1xxWq_L5baFfaa6jVt0AjzR3_lXkFCcPI/view?usp=drive_link' },
    { name: 'Pratyush Brakes', department: 'Aerospace Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/11akpmi5D8pcIqVpZOqQ0wW6UjHsqUV8I/view?usp=sharing' },
    { name: 'Shubhranil Chatterjee', department: 'Aerospace Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/1IdVUZ7qLnH0e5Ff74ySjzgE02Ys522F3/view?usp=drive_link' },
    { name: 'Diya Arvind', department: 'Biosciences & Bioengineering', type: 'Minor', url: 'https://drive.google.com/file/d/1-PrOXpHbk858hbMABOlqyLMzMzKibvNv/view?usp=drive_link' },
    { name: 'Kadambari Bhide', department: 'Biosciences & Bioengineering', type: 'Minor', url: 'https://drive.google.com/file/d/1vSgter4A7g_RronJn3LhtnSAv8IHJSGk/view?usp=sharing' },
    { name: 'Avanti Kulkarni', department: 'Centre for Digital Health (KCDH)', type: 'Minor', url: 'https://drive.google.com/file/d/1M2WAPV7Z4uSpbFiM6y_CHeaBJT4DxcW-/view?usp=drive_link' },
    { name: 'Dhruv', department: 'Centre for Digital Health (KCDH)', type: 'Minor', url: 'https://drive.google.com/file/d/1zLCuGju0VOtqiqu0Mp5tgz62NFQfSKED/view?usp=drive_link' },
    { name: 'Harsh Raj', department: 'Centre for Digital Health (KCDH)', type: 'Minor', url: 'https://drive.google.com/file/d/1TeUHB8eQ84sYy5FgEz4if94OTvEvR1-T/view?usp=drive_link' },
    { name: 'Aatreyi Bhatia', department: 'Centre for Machine Intelligence and Data Science (C-MInDS)', type: 'Minor', url: 'https://drive.google.com/file/d/1fUobOmspn5I9W8gqcOyfLKeVb9xrH_FE/view?usp=drive_link' },
    { name: 'Dibyanshu Dash', department: 'Centre for Machine Intelligence and Data Science (C-MInDS)', type: 'Minor', url: 'https://docs.google.com/document/d/1MaihU1niWPTS4nqw4sao7Qd8wzFn3wnk6JJYuYp8IhE/edit?usp=drive_link' },
    { name: 'Jeet Gurbani', department: 'Centre for Machine Intelligence and Data Science (C-MInDS)', type: 'Minor', url: 'https://drive.google.com/file/d/1SM3ENu4DZbmQ0DrGROfO4MZJhckiY3_i/view?usp=drive_link' },
    { name: 'Kandarp Solanki', department: 'Centre for Machine Intelligence and Data Science (C-MInDS)', type: 'Minor', url: 'https://drive.google.com/file/d/1mlaDQlEWVOHikkxlr7Sh-kfsXDhyG2MY/view?usp=drive_link' },
    { name: 'Pal Aggarwal', department: 'Centre for Machine Intelligence and Data Science (C-MInDS)', type: 'Minor', url: 'https://drive.google.com/file/d/1WGmv1yAtabsCKOnWzN9zjZV445owOY4R/view?usp=drive_link' },
    { name: 'Pranav Chaudhari', department: 'Centre for Machine Intelligence and Data Science (C-MInDS)', type: 'Minor', url: 'https://drive.google.com/file/d/1ElgenfYpyurJUoE6W3E-d58tP7bNxcj9/view?usp=drive_link' },
    { name: 'Rishi Tunuguntla', department: 'Centre for Machine Intelligence and Data Science (C-MInDS)', type: 'Minor', url: 'https://drive.google.com/file/d/1ktBJBkl_epfCtu0xOl8tiXn_tKc5a_Tp/view?usp=drive_link' },
    { name: 'Rohan Kalbag', department: 'Centre for Machine Intelligence and Data Science (C-MInDS)', type: 'Minor', url: 'https://drive.google.com/file/d/1lJtXz3j9QOTSGt06jFPl7eGCQ68Bmd8G/view?usp=drive_link' },
    { name: 'Shravya Suresh', department: 'Centre for Machine Intelligence and Data Science (C-MInDS)', type: 'Minor', url: 'https://drive.google.com/file/d/1-kg61jhPigy3VQyOOqcRXNOIAK-aWw_t/view?usp=drive_link' },
    { name: 'Utkarsh Chavan', department: 'Centre for Machine Intelligence and Data Science (C-MInDS)', type: 'Minor', url: 'https://drive.google.com/file/d/19lWGXJBY1SjDxVBWFyiajTLNr7n3AMFz/view?usp=drive_link' },
    { name: 'Devashish Bhave', department: 'Chemistry', type: 'Minor', url: 'https://drive.google.com/file/d/18EE3bmjps8QEVtqm0gL3vhzhn-AXM6HA/view?usp=drive_link' },
    { name: 'Agnipratim Nag', department: 'Computer Science and Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/1erJYqEof0vAtf9gespm82czS3PNdeOHZ/view?usp=drive_link' },
    { name: 'Harman Agrawal', department: 'Computer Science and Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/1tdn_lfFGTADat82jocvLuF7QY3_ufPPE/view?usp=drive_link' },
    { name: 'Param Rathour', department: 'Computer Science and Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/1WQ3vLwwuFpADrNTQBh0TAY_vZMertaUB/view?usp=drive_link' },
    { name: 'Rohan Rajesh Kalbag', department: 'Computer Science and Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/1wuOd9yvTCq_B8owGRnE6oY1oL4mzKmYX/view?usp=drive_link' },
    { name: 'Rounak Desai', department: 'Computer Science and Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/1BX2geRWqQVqfIvS9se8lVXEl2Ayb70mt/view?usp=drive_link' },
    { name: 'Sahil Kale', department: 'Computer Science and Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/1MKxhiHqu7PTrz6oMYef8dpoJtbs6IYt-/view?usp=drive_link' },
    { name: 'Shravya Suresh', department: 'Computer Science and Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/1HKrS67yAxege_9ShFe__e6HxdrI3VKCN/view?usp=drive_link' },
    { name: 'Shubhhi Singh', department: 'Computer Science and Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/12jxCKZMsUInCsJhTgJ2GifOCckJD-bS0/view?usp=drive_link' },
    { name: 'Siddhant Midha', department: 'Computer Science and Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/1f6o7J1sbVDfd5Lk_6JJnKgYPLQAi5ekG/view?usp=drive_link' },
    { name: 'Shishir Lal', department: 'Economics', type: 'Minor', url: 'https://drive.google.com/file/d/1tEF9mOrV_UrnVijv_AANx6EQCyhHbviH/view?usp=drive_link' },
    { name: 'Tiyash Dutta', department: 'Electrical Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/1IjtdRu-aSpgLS8jrhIPBMWWvz7uaX3nB/view?usp=drive_link' },
    { name: 'Tharun Sidambaram', department: 'Energy Science and Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/1tXGbojQOOC6dGCowQFoRh1sflH3dBZcs/view?usp=drive_link' },
    { name: 'Ashwin Goyal', department: 'Engineering Physics', type: 'Minor', url: 'https://drive.google.com/file/d/1xENtvsMC7DjZd9AGvuVs_MUB6E8G_N2Y/view?usp=drive_link' },
    { name: 'Siddhant Midha', department: 'Engineering Physics', type: 'Minor', url: 'https://drive.google.com/file/d/1jhSUQrjmdjIbLWPYFaxByrMF5iLsvoMZ/view?usp=drive_link' },
    { name: 'Tamojeet Rowchowdhary', department: 'Engineering Physics', type: 'Minor', url: 'https://drive.google.com/file/d/1LgYxIRRDpg_KaKSYfbATdf2Nd9FU_nV9/view?usp=drive_link' },
    { name: 'Vishnu Ravi', department: 'Engineering Physics', type: 'Minor', url: 'https://drive.google.com/file/d/1Z2uiLTq0shTip4PdLkC8rPYV3sSx-44n/view?usp=drive_link' },
    { name: 'Harsh Shah', department: 'Entrepreneurship', type: 'Minor', url: 'https://drive.google.com/file/d/1jAHgRZeKMJm4HdnWdIjne0l24pGyJypT/view?usp=drive_link' },
    { name: 'Aditya Agarwal', department: 'Mathematics', type: 'Minor', url: 'https://drive.google.com/file/d/1ghJ778fn3ns-1gD5F9PwiHoOgJ9lA5QT/view?usp=drive_link' },
    { name: 'Aneesh Kamat', department: 'Mathematics', type: 'Minor', url: 'https://drive.google.com/file/d/1H3cAmof7aWnPyLL5u7n9yB8HbDpBJuSA/view?usp=drive_link' },
    { name: 'Anurag Pendse', department: 'Mathematics', type: 'Minor', url: 'https://drive.google.com/file/d/1DmcSbjVKOgbRl_76eUvW_PtQ9Af9WB8n/view?usp=drive_link' },
    { name: 'Navdha', department: 'Mathematics', type: 'Minor', url: 'https://drive.google.com/file/d/1aKyup3T0teAFj3UwVrpkKlPFk2s-DSCZ/view?usp=drive_link' },
    { name: 'Preethi Malyala', department: 'Mathematics', type: 'Minor', url: 'https://drive.google.com/file/d/1yp4Q-mch5mEzvnNirnVaAwndchtDhnhv/view?usp=drive_link' },
    { name: 'Rehmant Singh Chawla', department: 'Mathematics', type: 'Minor', url: 'https://drive.google.com/file/d/16nN4S8aNHi4Ch70llVAV4teqV5Cfm085/view?usp=drive_link' },
    { name: 'Sidhandt', department: 'Mathematics', type: 'Minor', url: 'https://drive.google.com/file/d/1WBjicBTZnwHE2H8kSmJHunjQ7275GTXc/view?usp=drive_link' },
    { name: 'Jainesh Mehta', department: 'Management', type: 'Minor', url: 'https://drive.google.com/file/d/1yy5n_oGglmf1SLPu-IRRXK4ZeeX3FQB9/view?usp=drive_link' },
    { name: 'Nishit Trivedi', department: 'Management', type: 'Minor', url: 'https://drive.google.com/file/d/1XgFW7udkChKWPD4P-6yQGmXskt94Bi-Z/view?usp=drive_link' },
    { name: 'Tushaar Jhamtani', department: 'Management', type: 'Minor', url: 'https://drive.google.com/file/d/1OWIUgI2bmRMpbUriXt4_Rf8e7VCIYPnk/view?usp=drive_link' },
    { name: 'Atharva Jaltare', department: 'Robotics', type: 'Minor', url: 'https://drive.google.com/file/d/1_QEYtiQHO4nX8Xc6528jZz8xvzznEXkc/view?usp=drive_link' },
    { name: 'Nishant Bhave', department: 'Robotics', type: 'Minor', url: 'https://drive.google.com/file/d/1uM14jqOpZmZR9sbxF32_E7PGs2YMRIqX/view?usp=drive_link' },
    { name: 'Nilabha Saha', department: 'Statistics', type: 'Minor', url: 'https://drive.google.com/file/d/1ojmeC7vyVzfWtYSR8p6hGYf_klin2dW0/view?usp=drive_link' },
    { name: 'Ameya Marakarkandy', department: 'Systems and Control Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/1x63NkXLTMF-3xy7LXmHIzdegdICOSuYE/view?usp=drive_link' },
    { name: 'Disha Gupta', department: 'Systems and Control Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/1JJq9McEH7tdNnM_isEKQS_h8aN9uq60k/view?usp=drive_link' },
    { name: 'Gokul', department: 'Systems and Control Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/1Kt2hMdP4xx1IS72bO1T8_4W3vAVtYfDZ/view?usp=drive_link' },
    { name: 'Jacob Sony', department: 'Systems and Control Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/1FURMoV-D-B41TkfzDcm0to7NyWiTWVQS/view?usp=drive_link' },
    { name: 'Mohammad Saad', department: 'Systems and Control Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/1ZRUBX5M_W6CzU9oU7k5gjdR-zKTT4Ssd/view?usp=drive_link' },
    { name: 'Pranav Gupta', department: 'Systems and Control Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/14Byu1wZ6tV7lIWXhnr4dAyGMSeHkSsKU/view?usp=drive_link' },
    { name: 'Shreyas', department: 'Systems and Control Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/1C0TTPRVc6S8OE1t7IM1uhTwCBqXdQmoE/view?usp=drive_link' },
    { name: 'Vighnesh', department: 'Systems and Control Engineering', type: 'Minor', url: 'https://drive.google.com/file/d/1ZD7wfGA68WCqlePDDrCdM0FrUuiTjnz8/view?usp=drive_link' },
    { name: 'Nayantara Ramakrishnan', department: 'MEMS', type: 'Minor', url: 'https://drive.google.com/file/d/1yKto6TW8Zi3ez3cloGQjeTcByGQ3qkic/view?usp=drive_link' },
    { name: 'Ashwin Abraham', department: 'Computer Science and Engineering', type: 'Honours', url: 'https://drive.google.com/file/d/1j3YILqLK9-DX45v990i-0BIsUvLkZV2W/view?usp=drive_link' },
    { name: 'Siddhant Midha', department: 'Computer Science and Engineering', type: 'Honours', url: 'https://docs.google.com/document/d/1oD3WkyWBeDMDNJX1Oj2oucQyaUpdEegv/edit?usp=drive_link&ouid=100686118765178245354&rtpof=true&sd=true' },
    { name: 'Vedang Asgaonkar', department: 'Computer Science and Engineering', type: 'Honours', url: 'https://drive.google.com/file/d/1XFt1R6tVP2vzqyRC-1jWfeSq-jvjIS8r/view?usp=drive_link' },
    { name: 'Pal Aggarwal', department: 'Engineering Physics', type: 'Honours', url: 'https://drive.google.com/file/d/1wVeizzIfu39dKuJ6xLL7YmOaBA-CKy5r/view?usp=drive_link' },
    { name: 'Devashish Bhave', department: 'MEMS', type: 'Honours', url: 'https://drive.google.com/file/d/1kJvrCbepTfriYh0CSXUKGV9NyVH_YyG6/view?usp=drive_link' },
    { name: 'Prajwal', department: 'MEMS', type: 'Honours', url: 'https://drive.google.com/file/d/1nx7ai55ZXmqhhT76wSOhcsNMf_2fPNVF/view?usp=drive_link' },
    { name: 'Prajwal', department: 'MEMS', type: 'Honours', url: 'https://drive.google.com/file/d/1DGFlTt6Z5u4-Vv8lKe-w0WSQrTrhEVfl/view?usp=drive_link' },
    { name: 'BB405 - Molecular Biology', department: 'Unconventional Course', type: 'Unconventional Course', url: 'https://drive.google.com/file/d/1SNJUqOstvJr-TBbi9xa9aRYgfq3SZ_N4/view' },
    { name: 'CH442 - Molecular Spectroscopy', department: 'Unconventional Course', type: 'Unconventional Course', url: 'https://drive.google.com/file/d/1v4n087pT6jbX5WOqCvXvBWGyFe9Mqvhl/view' },
    { name: 'CH806 - Molecular Photochemistry', department: 'Unconventional Course', type: 'Unconventional Course', url: 'https://drive.google.com/file/d/1Iy_21clFqqIs7RxqBpYulr-CX6Eb3MFz/view' },
    { name: 'CH818 - Single Molecule Fluorescence Spectroscopy', department: 'Unconventional Course', type: 'Unconventional Course', url: 'https://drive.google.com/file/d/1YGLoMWgEQTtnQ-VNzH1nFwi5byJzgXPB/view' },
    { name: 'BB400 - Molecular Biophysics', department: 'Unconventional Course', type: 'Unconventional Course', url: 'https://drive.google.com/file/d/1RpOE-hjxqnnV1UjixwC1hLHSyW_BY2Dm/view' },
    { name: 'MM6002 - Principles and Applications of Piezoelectric and Ferroelectric Materials', department: 'Unconventional Course', type: 'Unconventional Course', url: 'https://drive.google.com/file/d/1AQbqrE2Xws90r2ANpLKSwjnikmb8lm3T/view' },
    { name: 'CL726 - Introduction to Genomics', department: 'Unconventional Course', type: 'Unconventional Course', url: 'https://drive.google.com/file/d/1afwmKy3k10iwTuQ8Lzse7HCVbJcf3KYa/view' },
    { name: 'DH803 - Wearable Health Technologies', department: 'Unconventional Course', type: 'Unconventional Course', url: 'https://drive.google.com/file/d/1BDSWL1LjMr7ez0WtftbVldNWnL3ZN-XR/view' },
    { name: 'GNR649 - Planetary Sciences: Earth and Beyond', department: 'Unconventional Course', type: 'Unconventional Course', url: 'https://drive.google.com/file/d/1uUnCv2IQm_SM8vRJuMq9AaFpSEFcKupl/view' },
    { name: 'HS618 - Introduction to Indian Astronomy', department: 'Unconventional Course', type: 'Unconventional Course', url: 'https://drive.google.com/file/d/1_q7jc3kYGfEOFQqOeshCH1gytnzSxhRe/view' },
    { name: 'CM801 - Introduction to Risk Analysis', department: 'Unconventional Course', type: 'Unconventional Course', url: 'https://drive.google.com/file/d/19DM43OMz1xBlUQJnJpKTX463fyXX4bGC/view' },
    { name: 'CS406 - Modern Cryptography', department: 'Unconventional Course', type: 'Unconventional Course', url: 'https://drive.google.com/file/d/1zFSH9TonxZUPzPCQDqBDDdXAWjCdukwv/view' },
    { name: 'GNR607 - Principles of Satellite Image Processing', department: 'Unconventional Course', type: 'Unconventional Course', url: 'https://drive.google.com/file/d/1MjRY7mDbTEzuhCrKpj0dM6nunBmRaVRB/view' },
    { name: 'IE616 - Decision Analysis and Game Theory', department: 'Unconventional Course', type: 'Unconventional Course', url: 'https://drive.google.com/file/d/1kV_roHqfmuS6S1FbfZiJ0OfOxFnJ5nIK/view' },
    { name: 'Abhilasha', department: 'SLP/RnD', type: 'SLP/RnD', url: 'https://drive.google.com/file/d/1-zou3wQZI4hw4hdPL8l3aV6zzhuWpDJk/view?usp=drive_link' },
    { name: 'Advait Mehla', department: 'SLP/RnD', type: 'SLP/RnD', url: 'https://drive.google.com/file/d/1yq9f4YfWdccxrXUdHuakg7IVFl_u0WuJ/view?usp=drive_link' },
    { name: 'Kandarp Solanki', department: 'SLP/RnD', type: 'SLP/RnD', url: 'https://drive.google.com/file/d/1v3ufgbGRGKGb97gCHBcuXGXkcz0ebFAs/view?usp=drive_link' },
    { name: 'Prakriti Shah', department: 'SLP/RnD', type: 'SLP/RnD', url: 'https://drive.google.com/file/d/1r0MZzqOA2Ug1K8TnxylEhDEb6dXGD2fs/view?usp=drive_link' },
    { name: 'Rishi Tunuguntla', department: 'SLP/RnD', type: 'SLP/RnD', url: 'https://drive.google.com/file/d/17HY7NC_bYtwhocCbtPlFQrtm0q3mO9M1/view?usp=drive_link' },
    { name: 'Sara Ahire', department: 'SLP/RnD', type: 'SLP/RnD', url: 'https://drive.google.com/file/d/1oCEMikD86m8M6Qd_WR6ImDkSstVltug7/view?usp=drive_link' },
    { name: 'Spandan Anaokar', department: 'SLP/RnD', type: 'SLP/RnD', url: 'https://drive.google.com/file/d/1xvPPXgrxaqHKUDP6GV06BOFm7AfzXUPE/view?usp=drive_link' },
    { name: 'Tamojeet Rowchaowdhary', department: 'SLP/RnD', type: 'SLP/RnD', url: 'https://drive.google.com/file/d/1mklXr1tsI7npqcokXLUytcZtjb73mErg/view?usp=drive_link' },
    { name: 'Avanti Kulkarni', department: 'French', type: 'Language', url: 'https://drive.google.com/file/d/1dsOKExAVBHeEoOkQReh0wQvJsERlxWec/view?usp=drive_link' },
    { name: 'Ijaz', department: 'French', type: 'Language', url: 'https://drive.google.com/file/d/1Lj_CJJ5gWZQIqCRjt4dvaBkBfvGxGlli/view?usp=drive_link' },
    { name: 'Deepali Gupta', department: 'German', type: 'Language', url: 'https://drive.google.com/file/d/1Xk4lmk4Sdq8Zl_92BkgHrN-kfXpMu2xs/view?usp=drive_link' },
    { name: 'Abhinav Katiyar', department: 'Japanese', type: 'Language', url: 'https://drive.google.com/file/d/1RxvE87PAfx-1LGRQ0eso8RBkdc7EvDvG/view?usp=drive_link' },
    { name: 'Pranav Sai Reddy', department: 'Japanese', type: 'Language', url: 'https://drive.google.com/file/d/1QKB6PwE0cdtr9e6aFy2ntWRDiBNy4mOG/view?usp=drive_link' },
    { name: 'Chinese', department: 'Chinese', type: 'Language', url: 'https://drive.google.com/drive/folders/1Y1GB9-dlWBXmP3LZ4EKRsNydchHqxGrO' }
  ];

  var REVIEW_TYPE_ORDER = ['Minor', 'Honours', 'Unconventional Course', 'SLP/RnD', 'Language'];
  var REVIEW_TYPE_LABELS = {
    'Minor': 'Minor Reviews',
    'Honours': 'Honours Reviews',
    'Unconventional Course': 'Unconventional Courses',
    'SLP/RnD': 'SLP/RnD Reviews',
    'Language': 'Language Courses'
  };
  var REVIEW_TYPE_ANCHORS = {
    'Minor': 'sec-minor-reviews',
    'Honours': 'sec-Honours-reviews',
    'Unconventional Course': 'sec-unconventional-reviews',
    'SLP/RnD': 'sec-slp-reviews',
    'Language': 'sec-language-reviews'
  };
  var selectedReview = null;
  var reviewFilterQuery = '';
  var selectedDepartments = [];
  var selectedCategories = [];
  var REVIEW_SECTION_IDS = ['reviews','sec-minor-reviews','sec-Honours-reviews','sec-unconventional-reviews','sec-slp-reviews','sec-language-reviews'];
  var DEPARTMENT_REVIEW_ANCHORS = {
    'SLP/RnD': 'sec-slp-reviews',
    'Unconventional Course': 'sec-unconventional-reviews',
    'French': 'sec-language-reviews',
    'German': 'sec-language-reviews',
    'Japanese': 'sec-language-reviews',
    'Chinese': 'sec-language-reviews'
  };

  function isReviewSectionId(id){
    return REVIEW_SECTION_IDS.indexOf(id) >= 0;
  }

  var REVIEW_ANCHOR_TO_TYPE = {
    'sec-minor-reviews': 'Minor',
    'sec-Honours-reviews': 'Honours',
    'sec-unconventional-reviews': 'Unconventional Course',
    'sec-slp-reviews': 'SLP/RnD',
    'sec-language-reviews': 'Language'
  };

  // When the user opens a specific review section, preview its first review
  // instead of leaving a previously selected (stale) review on screen.
  function loadFirstReviewOfSection(anchorId){
    var type = REVIEW_ANCHOR_TO_TYPE[anchorId];
    if(!type) return;
    var list = getFilteredReviews().filter(function(r){ return r.type === type; });
    if(list.length) loadReview(list[0]);
  }

  function scrollReviewListTo(anchorId){
    if(!anchorId) return;
    var target = document.getElementById(anchorId);
    var panel = document.querySelector('.reviews-list-panel');
    if(!target || !panel) return;
    panel.scrollTop = target.offsetTop - panel.offsetTop - 8;
  }

  function navigateToReviewSection(anchorId){
    if(!anchorId) return;
    enterReviewsFullscreen();
    requestAnimationFrame(function(){
      renderReviewList();
      loadFirstReviewOfSection(anchorId);
      scrollReviewListTo(anchorId);
    });
  }

  function enterReviewsFullscreen(){
    var block = document.getElementById('reviews');
    if(block) block.classList.add('is-fullscreen');
    document.body.classList.add('review-fullscreen-open');
  }

  function exitReviewsFullscreen(){
    var block = document.getElementById('reviews');
    if(block) block.classList.remove('is-fullscreen');
    document.body.classList.remove('review-fullscreen-open');
  }

  function toggleReviewMobileFilters(){
    var panel = document.querySelector('.reviews-filters-reserved');
    var btn = document.getElementById('reviewFilterToggle');
    if(!panel || !btn) return;
    var open = panel.classList.toggle('mobile-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? 'Hide department filters' : 'Show department filters';
  }

  function toPreviewUrl(url){
    if(!url) return '';
    var docMatch = url.match(/docs\.google\.com\/document\/d\/([^/]+)/);
    if(docMatch) return 'https://docs.google.com/document/d/' + docMatch[1] + '/preview';
    var fileMatch = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if(fileMatch) return 'https://drive.google.com/file/d/' + fileMatch[1] + '/preview';
    return url.replace(/\/(edit|view)(\?.*)?$/, '/preview$2');
  }

  function loadReview(review){
    if(!review) return;
    selectedReview = review;
    var frame = document.getElementById('reviewFrame');
    var placeholder = document.getElementById('reviewPlaceholder');
    if(!frame || !placeholder) return;
    frame.src = toPreviewUrl(review.url);
    frame.classList.add('loaded');
    placeholder.style.display = 'none';
    renderReviewList();
  }

  function filterReviews(query){
    reviewFilterQuery = (query || '').trim().toLowerCase();
    renderReviewList();
  }

  function toggleDepartmentFilter(dept){
    var idx = selectedDepartments.indexOf(dept);
    var adding = idx < 0;
    if(idx >= 0) selectedDepartments.splice(idx, 1);
    else selectedDepartments.push(dept);
    renderReviewList();
    renderDepartmentFilters();
    if(adding && DEPARTMENT_REVIEW_ANCHORS[dept]){
      navigateToReviewSection(DEPARTMENT_REVIEW_ANCHORS[dept]);
    }
  }

  function clearDepartmentFilters(){
    selectedDepartments = [];
    renderReviewList();
    renderDepartmentFilters();
  }

  function toggleCategoryFilter(type){
    var idx = selectedCategories.indexOf(type);
    var adding = idx < 0;
    if(idx >= 0) selectedCategories.splice(idx, 1);
    else selectedCategories.push(type);
    renderReviewList();
    renderCategoryFilters();
    if(adding && REVIEW_TYPE_ANCHORS[type]){
      navigateToReviewSection(REVIEW_TYPE_ANCHORS[type]);
    }
  }

  function clearCategoryFilters(){
    selectedCategories = [];
    renderReviewList();
    renderCategoryFilters();
  }

  function renderCategoryFilters(){
    var panel = document.getElementById('reviewCategoryPanel');
    if(!panel) return;
    var html = REVIEW_TYPE_ORDER.map(function(type, i){
      var checked = selectedCategories.indexOf(type) >= 0 ? ' checked' : '';
      return '<label class="review-filter-item">'
        + '<input type="checkbox" data-cat-idx="' + i + '"' + checked + '>'
        + '<span>' + escapeHtml(REVIEW_TYPE_LABELS[type] || type) + '</span>'
        + '</label>';
    }).join('');
    if(selectedCategories.length){
      html += '<button type="button" class="review-filter-clear" id="reviewCategoryClear">Clear categories</button>';
    }
    panel.innerHTML = html;
    panel.querySelectorAll('input[type="checkbox"]').forEach(function(cb){
      cb.addEventListener('change', function(){
        toggleCategoryFilter(REVIEW_TYPE_ORDER[parseInt(cb.getAttribute('data-cat-idx'), 10)]);
      });
    });
    var clearBtn = document.getElementById('reviewCategoryClear');
    if(clearBtn) clearBtn.addEventListener('click', clearCategoryFilters);
  }

  function getReviewDepartments(){
    var depts = [];
    reviews.forEach(function(r){
      if(depts.indexOf(r.department) < 0) depts.push(r.department);
    });
    depts.sort(function(a, b){ return a.localeCompare(b); });
    return depts;
  }

  function getFilteredReviews(){
    var result = reviews.slice();
    if(selectedCategories.length){
      result = result.filter(function(r){
        return selectedCategories.indexOf(r.type) >= 0;
      });
    }
    if(selectedDepartments.length){
      result = result.filter(function(r){
        return selectedDepartments.indexOf(r.department) >= 0;
      });
    }
    if(reviewFilterQuery){
      result = result.filter(function(r){
        var hay = (r.name + ' ' + r.department + ' ' + r.type).toLowerCase();
        return hay.indexOf(reviewFilterQuery) >= 0;
      });
    }
    return result;
  }

  function renderDepartmentFilters(){
    var panel = document.getElementById('reviewFilterPanel');
    if(!panel) return;
    var depts = getReviewDepartments();
    var html = depts.map(function(dept, i){
      var checked = selectedDepartments.indexOf(dept) >= 0 ? ' checked' : '';
      return '<label class="review-filter-item">'
        + '<input type="checkbox" data-dept-idx="' + i + '"' + checked + '>'
        + '<span>' + escapeHtml(dept) + '</span>'
        + '</label>';
    }).join('');
    if(selectedDepartments.length){
      html += '<button type="button" class="review-filter-clear" id="reviewFilterClear">Clear filters</button>';
    }
    panel.innerHTML = html;
    panel._deptList = depts;
    panel.querySelectorAll('input[type="checkbox"]').forEach(function(cb){
      cb.addEventListener('change', function(){
        var dept = panel._deptList[parseInt(cb.getAttribute('data-dept-idx'), 10)];
        toggleDepartmentFilter(dept);
      });
    });
    var clearBtn = document.getElementById('reviewFilterClear');
    if(clearBtn) clearBtn.addEventListener('click', clearDepartmentFilters);
  }

  function renderReviewList(){
    var list = document.getElementById('reviewList');
    if(!list) return;
    var filtered = getFilteredReviews();
    var grouped = {};
    filtered.forEach(function(r){
      if(!grouped[r.type]) grouped[r.type] = [];
      grouped[r.type].push(r);
    });
    var html = '';
    REVIEW_TYPE_ORDER.forEach(function(type){
      var items = grouped[type];
      if(!items || !items.length) return;
      var anchorId = REVIEW_TYPE_ANCHORS[type] || '';
      html += '<div class="reviews-type-group">';
      html += '<div class="reviews-type-label"' + (anchorId ? ' id="' + anchorId + '"' : '') + '>' + escapeHtml(REVIEW_TYPE_LABELS[type] || type) + '</div>';
      items.forEach(function(review){
        var active = selectedReview === review ? ' active' : '';
        var reviewIndex = reviews.indexOf(review);
        html += '<button type="button" class="review-item' + active + '" onclick="loadReview(reviews[' + reviewIndex + '])">'
          + '<span class="review-item-name">' + escapeHtml(review.name) + '</span>'
          + '<span class="review-item-dept">' + escapeHtml(review.department) + '</span>'
          + '</button>';
      });
      html += '</div>';
    });
    if(!html){
      html = '<div class="review-placeholder" style="min-height:120px;padding:20px 16px;font-size:13px;">No reviews match the selected filters.</div>';
    }
    list.innerHTML = html;
  }

  renderReviewList();
  renderCategoryFilters();
  renderDepartmentFilters();

  var IDDDP_REVIEW_TYPE_ORDER = ['IDDDP', 'DDP'];
  var IDDDP_REVIEW_TYPE_LABELS = {
    'IDDDP': 'IDDDP Reviews',
    'DDP': 'Dual Degree (DDP) Reviews'
  };
  var IDDDP_REVIEW_TYPE_ANCHORS = {
    'IDDDP': 'sec-idddp-reviews-idddp',
    'DDP': 'sec-idddp-reviews-ddp'
  };
  var selectedIdddpReview = null;
  var selectedIdddpDepartments = [];

  function enterIdddpReviewsFullscreen(){
    var block = document.getElementById('idddp-reviews-block');
    if(block) block.classList.add('is-fullscreen');
    document.body.classList.add('review-fullscreen-open');
  }

  function exitIdddpReviewsFullscreen(){
    var block = document.getElementById('idddp-reviews-block');
    if(block) block.classList.remove('is-fullscreen');
    document.body.classList.remove('review-fullscreen-open');
  }

  function toggleIdddpReviewMobileFilters(){
    var panel = document.querySelector('#idddp-reviews-block .reviews-filters-reserved');
    var btn = document.getElementById('idddpReviewFilterToggle');
    if(!panel || !btn) return;
    var open = panel.classList.toggle('mobile-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? 'Hide department filters' : 'Show department filters';
  }

  function formatReviewAnswer(text){
    return escapeHtml(text).replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
  }

  function loadIdddpReview(review){
    if(!review) return;
    selectedIdddpReview = review;
    var content = document.getElementById('idddpReviewContent');
    var placeholder = document.getElementById('idddpReviewPlaceholder');
    if(!content || !placeholder) return;
    var programLabel = review.program === 'IDDDP' ? 'IDDDP' : 'Dual Degree (DDP)';
    var meta = '<div class="review-content-meta">'
      + '<strong>Review by ' + escapeHtml(review.name) + '</strong><br>'
      + escapeHtml(programLabel)
      + ' &nbsp;|&nbsp; Host department — ' + escapeHtml(review.hostDept)
      + '</div>';
    var body = review.sections.map(function(sec){
      return '<h3>' + escapeHtml(sec.q) + '</h3><p>' + formatReviewAnswer(sec.a) + '</p>';
    }).join('');
    content.innerHTML = meta + body;
    content.classList.add('loaded');
    placeholder.style.display = 'none';
    renderIdddpReviewList();
  }

  function toggleIdddpDepartmentFilter(dept){
    var idx = selectedIdddpDepartments.indexOf(dept);
    if(idx >= 0) selectedIdddpDepartments.splice(idx, 1);
    else selectedIdddpDepartments.push(dept);
    renderIdddpReviewList();
    renderIdddpDepartmentFilters();
  }

  function clearIdddpDepartmentFilters(){
    selectedIdddpDepartments = [];
    renderIdddpReviewList();
    renderIdddpDepartmentFilters();
  }

  function getIdddpReviewDepartments(){
    var depts = [];
    idddpReviews.forEach(function(r){
      if(depts.indexOf(r.hostDept) < 0) depts.push(r.hostDept);
    });
    depts.sort(function(a, b){ return a.localeCompare(b); });
    return depts;
  }

  function getFilteredIdddpReviews(){
    if(!selectedIdddpDepartments.length) return idddpReviews.slice();
    return idddpReviews.filter(function(r){
      return selectedIdddpDepartments.indexOf(r.hostDept) >= 0;
    });
  }

  function renderIdddpDepartmentFilters(){
    var panel = document.getElementById('idddpReviewFilterPanel');
    if(!panel) return;
    var depts = getIdddpReviewDepartments();
    var html = depts.map(function(dept, i){
      var checked = selectedIdddpDepartments.indexOf(dept) >= 0 ? ' checked' : '';
      return '<label class="review-filter-item">'
        + '<input type="checkbox" data-dept-idx="' + i + '"' + checked + '>'
        + '<span>' + escapeHtml(dept) + '</span>'
        + '</label>';
    }).join('');
    if(selectedIdddpDepartments.length){
      html += '<button type="button" class="review-filter-clear" id="idddpReviewFilterClear">Clear filters</button>';
    }
    panel.innerHTML = html;
    panel._deptList = depts;
    panel.querySelectorAll('input[type="checkbox"]').forEach(function(cb){
      cb.addEventListener('change', function(){
        var dept = panel._deptList[parseInt(cb.getAttribute('data-dept-idx'), 10)];
        toggleIdddpDepartmentFilter(dept);
      });
    });
    var clearBtn = document.getElementById('idddpReviewFilterClear');
    if(clearBtn) clearBtn.addEventListener('click', clearIdddpDepartmentFilters);
  }

  function renderIdddpReviewList(){
    var list = document.getElementById('idddpReviewList');
    if(!list) return;
    var filtered = getFilteredIdddpReviews();
    var grouped = {};
    filtered.forEach(function(r){
      if(!grouped[r.program]) grouped[r.program] = [];
      grouped[r.program].push(r);
    });
    var html = '';
    IDDDP_REVIEW_TYPE_ORDER.forEach(function(type){
      var items = grouped[type];
      if(!items || !items.length) return;
      var anchorId = IDDDP_REVIEW_TYPE_ANCHORS[type] || '';
      html += '<div class="reviews-type-group">';
      html += '<div class="reviews-type-label"' + (anchorId ? ' id="' + anchorId + '"' : '') + '>' + escapeHtml(IDDDP_REVIEW_TYPE_LABELS[type] || type) + '</div>';
      items.forEach(function(review){
        var active = selectedIdddpReview === review ? ' active' : '';
        var reviewIndex = idddpReviews.indexOf(review);
        html += '<button type="button" class="review-item' + active + '" onclick="loadIdddpReview(idddpReviews[' + reviewIndex + '])">'
          + '<span class="review-item-name">' + escapeHtml(review.name) + '</span>'
          + '<span class="review-item-dept">' + escapeHtml(review.hostDept) + '</span>'
          + '</button>';
      });
      html += '</div>';
    });
    if(!html){
      html = '<div class="review-placeholder" style="min-height:120px;padding:20px 16px;font-size:13px;">No reviews match the selected filters.</div>';
    }
    list.innerHTML = html;
  }

  renderIdddpReviewList();
  renderIdddpDepartmentFilters();

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape'){
      if(document.getElementById('reviews') && document.getElementById('reviews').classList.contains('is-fullscreen')){
        exitReviewsFullscreen();
      }
      if(document.getElementById('idddp-reviews-block') && document.getElementById('idddp-reviews-block').classList.contains('is-fullscreen')){
        exitIdddpReviewsFullscreen();
      }
    }
  });
 
  /* ---------- Scroll-spy for the booklet sidebar ---------- */
  function initScrollSpy(){
    var links = Array.prototype.slice.call(document.querySelectorAll('aside.side a[data-target]'));
    if(!links.length || !('IntersectionObserver' in window)) return;
    var targets = links.map(function(a){ return document.getElementById(a.getAttribute('data-target')); }).filter(Boolean);
    var visible = {};
    var obs = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting) visible[e.target.id] = true; else delete visible[e.target.id]; });
      var current = null;
      targets.slice().reverse().forEach(function(t){ if(visible[t.id] && !current) current = t.id; });
      if(!current) return;
      links.forEach(function(a){ a.classList.toggle('active', a.getAttribute('data-target') === current); });
    }, {rootMargin:'-90px 0px -65% 0px', threshold:0});
    targets.forEach(function(t){ obs.observe(t); });
  }
 
  /* ---------- Scroll reveal (fade-in) ---------- */
  function initReveal(){
    if(!('IntersectionObserver' in window)) return;
    var els = Array.prototype.slice.call(document.querySelectorAll('.block, .toc-card, .res-grid a, .card-person'));
    var ro = new IntersectionObserver(function(entries, o){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); o.unobserve(e.target); } });
    }, {threshold:0.06, rootMargin:'0px 0px -30px 0px'});
    els.forEach(function(el){
      el.classList.add('reveal');
      var r = el.getBoundingClientRect();
      var visibleNow = el.offsetParent !== null && r.top < (window.innerHeight || 800) && r.bottom > 0;
      if(visibleNow){ el.classList.add('in'); }   // synchronous: no flash for above-the-fold
      else { ro.observe(el); }
    });
    // Safety net: on some mobile browsers the IntersectionObserver callback can be
    // delayed, leaving in-viewport content stuck at opacity:0 (a blank page). After a
    // short delay, force-reveal any element that is already within the viewport.
    setTimeout(function(){
      els.forEach(function(el){
        if(el.classList.contains('in')) return;
        var r = el.getBoundingClientRect();
        if(el.offsetParent !== null && r.top < (window.innerHeight || 800) && r.bottom > 0){
          el.classList.add('in');
        }
      });
    }, 600);
  }
 
  
 
  // build interactive features after the correct page is shown
  
  
  
 
  
  /* ---------- Modular Multi-page Initialization ---------- */
  function initNavigation(){
    var path = window.location.pathname;
    var page = 'home';
    if(path.indexOf('resources.html') >= 0) page = 'resources';
    else if(path.indexOf('policy-newsletter.html') >= 0) page = 'resources';
    else if(path.indexOf('dues.html') >= 0) page = 'resources';
    else if(path.indexOf('fast-track-degree.html') >= 0) page = 'resources';
    else if(path.indexOf('rejoining-procedure.html') >= 0) page = 'resources';
    else if(path.indexOf('idddp') >= 0) page = 'idddp';
    else if(path.indexOf('grad') >= 0) page = 'grad';
    else if(path.indexOf('contact.html') >= 0) page = 'contact';
    else if(path.indexOf('content.html') >= 0) page = 'content';

    var navPage = page.startsWith('idddp-') ? 'idddp' : (page.startsWith('grad') ? 'grad' : page);
    setActiveNav(navPage);
  }

  window.addEventListener('DOMContentLoaded', function(){
    initNavigation();
    initReveal();
    
    // Page specific initialization
    if(document.querySelector('aside.side')){
      initScrollSpy();
    }
    if(document.getElementById('reviews')){
      renderReviewList();
      renderCategoryFilters();
      renderDepartmentFilters();
    }
    if(document.getElementById('idddp-reviews-block') && typeof idddpReviews !== 'undefined'){
      renderIdddpReviewList();
      renderIdddpDepartmentFilters();
    }

    // Scroll to hash target if present
    var hash = (location.hash || '').replace('#', '');
    if(hash){
      setTimeout(function(){
        scrollTo2(hash);
      }, 100);
    }
    
    // Disclaimer logic
    var discBtn = document.getElementById('discBtn');
    var discOver = document.getElementById('discOver');
    if(discBtn && discOver){
      discBtn.addEventListener('click', function(){ discOver.classList.add('open'); });
      discOver.addEventListener('click', function(e){ if(e.target === discOver) discOver.classList.remove('open'); });
      var closeBtn = discOver.querySelector('.disc-close');
      if(closeBtn) closeBtn.addEventListener('click', function(){ discOver.classList.remove('open'); });
      document.addEventListener('keydown', function(e){ if(e.key === 'Escape') discOver.classList.remove('open'); });
      
      try {
        if (!sessionStorage.getItem('ugwiki-disclaimer-seen')) {
          setTimeout(function(){ 
            discOver.classList.add('open'); 
            sessionStorage.setItem('ugwiki-disclaimer-seen', 'true');
          }, 400);
        }
      } catch (e) {
        setTimeout(function(){ discOver.classList.add('open'); }, 400);
      }
    }
  });
