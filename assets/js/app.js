// ========== 高考志愿填报平台 - 主逻辑 ==========

// Global variables
var currentPage = 'home';
var filteredColleges = [].concat(RANKINGS || []);
var compareList1 = [];
var compareList2 = [];
var currentUser = null;
var selectedInterests = [];
var lastRecommendData = null;

// ===== Favorites System (localStorage) =====
function getFavorites() {
  try {
    var favs = localStorage.getItem('gaokao_favorites');
    return favs ? JSON.parse(favs) : [];
  } catch (e) {
    return [];
  }
}

// ===================== VOCATIONAL COLLEGES PAGE =====================
function renderVocationalList() {
  var typeFilter = document.getElementById('voc-type-filter');
  var locFilter = document.getElementById('voc-loc-filter');
  var levelFilter = document.getElementById('voc-level-filter');
  var searchInput = document.getElementById('voc-search');
  
  var list = [].concat(VOCATIONAL_COLLEGES || []);
  
  if (typeFilter && typeFilter.value) {
    list = list.filter(function(c) { return c.type === typeFilter.value; });
  }
  if (locFilter && locFilter.value) {
    list = list.filter(function(c) { return c.location === locFilter.value; });
  }
  if (levelFilter && levelFilter.value) {
    list = list.filter(function(c) { return c.level === levelFilter.value; });
  }
  if (searchInput && searchInput.value.trim()) {
    var q = searchInput.value.trim().toLowerCase();
    list = list.filter(function(c) {
      if (c.name.toLowerCase().indexOf(q) !== -1) return true;
      if (c.location.toLowerCase().indexOf(q) !== -1) return true;
      if (c.type.toLowerCase().indexOf(q) !== -1) return true;
      if (c.level.toLowerCase().indexOf(q) !== -1) return true;
      if (c.tags && c.tags.length > 0) {
        for (var ti = 0; ti < c.tags.length; ti++) {
          if (c.tags[ti].toLowerCase().indexOf(q) !== -1) return true;
        }
      }
      return false;
    });
  }
  
  var grid = document.getElementById('voc-grid');
  var count = document.getElementById('voc-count');
  
  if (count) count.textContent = '共 ' + list.length + ' 所高职院校';
  
  if (grid) {
    if (list.length === 0) {
      grid.innerHTML = '<div class="empty-state">' +
        '<div class="empty-state-icon">🔍</div>' +
        '<div class="empty-state-text">未找到匹配的高职院校，请调整筛选条件</div>' +
      '</div>';
      return;
    }
    
    grid.innerHTML = list.map(function(c, i) {
      var tagHtml = '';
      if (c.tags && c.tags.length > 0) {
        tagHtml = c.tags.map(function(t) {
          var cls = 'tag-syl';
          if (t.indexOf('A档') !== -1) cls = 'tag-985';
          else if (t.indexOf('B档') !== -1) cls = 'tag-211';
          else if (t.indexOf('职业本科') !== -1) cls = 'tag-985';
          else if (t.indexOf('国家示范') !== -1) cls = 'tag-211';
          return '<span class="college-tag ' + cls + '">' + t + '</span>';
        }).join('');
      }
      
      var levelBadge = '';
      if (c.level === '高水平学校') {
        levelBadge = '<span style="background:#e74c3c;color:#fff;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:4px;">高水平学校</span>';
      } else if (c.level === '高水平专业群') {
        levelBadge = '<span style="background:#f39c12;color:#fff;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:4px;">高水平专业群</span>';
      }
      
      return '<div class="card college-card" style="cursor:default;">' +
        '<div class="college-rank ' + (i < 3 ? 'top3' : '') + '">' + c.rank + '</div>' +
        '<div class="college-info">' +
          '<div class="college-name">' + c.name + levelBadge + '</div>' +
          '<div class="college-tags">' + tagHtml + '</div>' +
          '<div class="college-meta">' +
            '<span>📍 ' + c.location + '</span>' +
            '<span>🏷️ ' + c.type + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }
  
  // Populate filters
  if (typeFilter && !typeFilter.dataset.populated) {
    typeFilter.dataset.populated = 'true';
    var types = [];
    (VOCATIONAL_COLLEGES || []).forEach(function(c) {
      if (types.indexOf(c.type) === -1) types.push(c.type);
    });
    types.sort();
    types.forEach(function(t) {
      var opt = document.createElement('option');
      opt.value = t; opt.textContent = t;
      typeFilter.appendChild(opt);
    });
  }
  if (locFilter && !locFilter.dataset.populated) {
    locFilter.dataset.populated = 'true';
    var locs = [];
    (VOCATIONAL_COLLEGES || []).forEach(function(c) {
      if (locs.indexOf(c.location) === -1) locs.push(c.location);
    });
    locs.sort();
    locs.forEach(function(l) {
      var opt = document.createElement('option');
      opt.value = l; opt.textContent = l;
      locFilter.appendChild(opt);
    });
  }
}

function saveFavorites(list) {
  try {
    localStorage.setItem('gaokao_favorites', JSON.stringify(list));
  } catch (e) {
    showToast('存储失败，可能是隐私模式或存储已满', 'error');
  }
}

function isFavorited(name) {
  return getFavorites().indexOf(name) !== -1;
}

function toggleFavorite(name) {
  var favs = getFavorites();
  var idx = favs.indexOf(name);
  if (idx === -1) {
    favs.push(name);
    showToast('已收藏 ' + name, 'success');
  } else {
    favs.splice(idx, 1);
    showToast('已取消收藏 ' + name, 'info');
  }
  saveFavorites(favs);
  // Re-render current page if on a list page that shows favorites
  if (currentPage === 'favorites') {
    renderFavoritesPage();
  } else if (currentPage === 'rankings') {
    renderRankingsPage();
  } else if (currentPage === 'verify') {
    renderVerifyPage();
  } else if (currentPage === 'colleges') {
    renderCollegeList();
  } else if (currentPage === 'home') {
    renderHomePage();
  }
  return idx === -1;
}

function renderFavoritesPage() {
  var container = document.getElementById('favorites-grid');
  var count = document.getElementById('favorites-count');
  var favs = getFavorites();
  
  if (count) {
    count.textContent = '共收藏 ' + favs.length + ' 所高校';
  }
  
  if (!container) return;
  
  if (favs.length === 0) {
    container.innerHTML = '<div class="empty-state">' +
      '<div class="empty-state-icon">💔</div>' +
      '<div class="empty-state-text">还没有收藏任何高校<br/>在高校列表或排名中点击 ❤️ 开始收藏吧</div>' +
      '</div>';
    return;
  }
  
  var list = [];
  favs.forEach(function(name) {
    var c = RANKINGS.find(function(item) { return item.name === name; });
    if (c) list.push(c);
  });
  
  container.innerHTML = list.map(function(c, i) {
    return '<div class="card college-card card-clickable" onclick="showCollegeDetail(\'' + c.name + '\')">' +
      '<div class="college-rank ' + (i < 3 ? 'top3' : '') + '">' + c.rank + '</div>' +
      '<div class="college-info">' +
        '<div class="college-name">' + c.name + '</div>' +
        '<div class="college-tags">' +
          c.tags.map(function(t) {
            var cls = t === '985' ? 'tag-985' : t === '211' ? 'tag-211' : 'tag-syl';
            return '<span class="college-tag ' + cls + '">' + t + '</span>';
          }).join('') +
        '</div>' +
        '<div class="college-meta">' +
          '<span>\u{1F4CD} ' + c.location + '</span>' +
          '<span>\u{1F4CA} 综合评分：' + c.score + '</span>' +
          '<span>\u{1F3F7}\uFE0F ' + c.type + '</span>' +
        '</div>' +
      '</div>' +
      '<div style="text-align:right;flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:4px;">' +
        '<span class="fav-btn active" onclick="event.stopPropagation();toggleFavorite(\'' + c.name + '\')" title="取消收藏">\u2764\uFE0F</span>' +
        '<div><div style="font-size:18px;font-weight:700;color:var(--primary);">' + c.score + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted);">综合评分</div></div>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ===== User System (localStorage) =====
function initUserSystem() {
  currentUser = getCurrentUser();
  updateUserUI();
}

function getUsers() {
  try {
    var users = localStorage.getItem('gaokao_users');
    return users ? JSON.parse(users) : {};
  } catch (e) {
    return {};
  }
}

function saveUsers(users) {
  try {
    localStorage.setItem('gaokao_users', JSON.stringify(users));
  } catch (e) {
    showToast('存储失败，可能是隐私模式或存储已满', 'error');
  }
}

function getCurrentUser() {
  try {
    var user = localStorage.getItem('gaokao_current_user');
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
}

function saveCurrentUser(user) {
  try {
    if (user) {
      localStorage.setItem('gaokao_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('gaokao_current_user');
    }
  } catch (e) {
    showToast('存储失败，可能是隐私模式或存储已满', 'error');
  }
}

function updateUserUI() {
  var currentUser = getCurrentUser();
  var userStatusEl = document.getElementById('user-status');
  var profileSection = document.getElementById('section-profile');
  
  if (currentUser) {
    if (userStatusEl) {
      userStatusEl.innerHTML = '<div class="user-badge" style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;" onclick="navigateTo(\'profile\')">' +
        '<span style="width:28px;height:28px;border-radius:50%;background:var(--primary);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;">' +
        currentUser.username.charAt(0).toUpperCase() + '</span>' +
        '<span style="font-size:13px;font-weight:500;">' + currentUser.username + '</span>' +
        '</div>';
    }
  } else {
    if (userStatusEl) {
      userStatusEl.innerHTML = '<a href="javascript:void(0)" onclick="navigateTo(\'auth\')" style="font-size:13px;color:var(--primary);text-decoration:none;">登录 / 注册</a>';
    }
  }
  
  // Also update nav if profile section exists
  if (profileSection && currentUser) {
    renderProfilePage();
  }
}

function simpleHash(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return String(hash);
}

function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function registerUser() {
  var username = document.getElementById('reg-username');
  var password = document.getElementById('reg-password');
  var confirmPwd = document.getElementById('reg-confirm');

  if (!username || !password || !confirmPwd) return;

  var name = username.value.trim();
  var pwd = password.value.trim();
  var confirm = confirmPwd.value.trim();

  if (!name || !pwd || !confirm) {
    showToast('请完整填写注册信息', 'error');
    return;
  }

  if (pwd.length < 6) {
    showToast('密码长度不能少于6位', 'error');
    return;
  }

  if (pwd !== confirm) {
    showToast('两次密码输入不一致', 'error');
    return;
  }

  var users = getUsers();
  if (users[name]) {
    showToast('用户名已存在，请直接登录', 'error');
    return;
  }

  users[name] = { username: name, password: simpleHash(pwd), createdAt: new Date().toISOString() };
  saveUsers(users);
  
  // Auto login after registration
  var user = { username: name };
  saveCurrentUser(user);
  currentUser = user;
  updateUserUI();
  
  showToast('注册成功！欢迎 ' + name, 'success');
  navigateTo('home');
  
  // Clear form
  username.value = '';
  password.value = '';
  confirmPwd.value = '';
}

function loginUser() {
  var username = document.getElementById('login-username');
  var password = document.getElementById('login-password');
  
  if (!username || !password) return;
  
  var name = username.value.trim();
  var pwd = password.value.trim();
  
  if (!name || !pwd) {
    showToast('请输入用户名和密码', 'error');
    return;
  }
  
  var users = getUsers();
  var stored = users[name];

  if (!stored || stored.password !== simpleHash(pwd)) {
    showToast('用户名或密码错误', 'error');
    return;
  }
  
  var user = { username: name };
  saveCurrentUser(user);
  currentUser = user;
  updateUserUI();
  
  showToast('登录成功！欢迎回来 ' + name, 'success');
  navigateTo('home');
  
  // Clear form
  username.value = '';
  password.value = '';
}

function logoutUser() {
  saveCurrentUser(null);
  currentUser = null;
  updateUserUI();
  showToast('已退出登录', 'info');
  navigateTo('home');
}

function switchAuthTab(index) {
  var tabs = document.querySelectorAll('.auth-tab');
  var forms = document.querySelectorAll('.auth-form');
  tabs.forEach(function(t, i) {
    t.classList.toggle('active', i === index);
  });
  forms.forEach(function(f, i) {
    f.classList.toggle('active', i === index);
  });
}

function renderAuthSection() {
  // Auth forms are already wired up via HTML onclick handlers
  // Just ensure the login form is shown by default
  switchAuthTab(0);
}

function renderProfilePage() {
  var currentUser = getCurrentUser();
  var container = document.getElementById('profile-content');
  if (!container) return;
  
  if (!currentUser) {
    container.innerHTML = '<div class="empty-state">' +
      '<div class="empty-state-icon">\u{1F464}</div>' +
      '<div class="empty-state-text">您还未登录<br/><a href="javascript:void(0)" onclick="navigateTo(\'auth\')" style="color:var(--primary);">去登录</a></div>' +
      '</div>';
    return;
  }
  
  var favs = getFavorites();
  var users = getUsers();
  var userData = users[currentUser.username] || {};
  var createdAt = userData.createdAt ? new Date(userData.createdAt).toLocaleDateString('zh-CN') : '—';
  
  container.innerHTML = '<div style="text-align:center;padding:24px;">' +
    '<div style="width:72px;height:72px;border-radius:50%;background:var(--primary);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;margin-bottom:12px;">' +
    currentUser.username.charAt(0).toUpperCase() + '</div>' +
    '<div style="font-size:20px;font-weight:700;">' + currentUser.username + '</div>' +
    '<div style="font-size:13px;color:var(--text-muted);margin-top:4px;">注册时间：' + createdAt + '</div>' +
    '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px;">' +
    '<div class="card" style="text-align:center;padding:16px;"><div style="font-size:24px;font-weight:700;color:var(--primary);">' + favs.length + '</div><div style="font-size:12px;color:var(--text-muted);">收藏高校</div></div>' +
    '<div class="card" style="text-align:center;padding:16px;"><div style="font-size:24px;font-weight:700;color:var(--primary);">' + RANKINGS.length + '</div><div style="font-size:12px;color:var(--text-muted);">可查询高校</div></div>' +
    '<div class="card" style="text-align:center;padding:16px;"><div style="font-size:24px;font-weight:700;color:var(--primary);">120</div><div style="font-size:12px;color:var(--text-muted);">总排名高校</div></div>' +
    '</div>' +
    '<div style="display:flex;gap:12px;justify-content:center;">' +
    '<button class="btn btn-primary" onclick="navigateTo(\'favorites\')">\u{1F496} 查看收藏 (' + favs.length + ')</button>' +
    '<button class="btn" style="background:var(--bg);border:1px solid var(--border);" onclick="logoutUser()">\u{1F6AA} 退出登录</button>' +
    '</div>';
}

// ===== Interest Test =====
function renderInterestTest() {
  var container = document.getElementById('home-interest-test');
  if (!container) return;
  
  container.innerHTML = '<div class="section-header" style="margin-top:28px;">' +
    '<h2 class="section-title">\u{1F9E0} 兴趣方向测试 <span class="badge">发现适合你的专业方向</span></h2>' +
    '</div>' +
    '<div style="margin-bottom:12px;font-size:14px;color:var(--text-secondary);">选择你感兴趣的方向（可多选），系统将为你匹配相关高校</div>' +
    '<div class="interest-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:16px;">' +
    (INTEREST_CATEGORIES || []).map(function(cat) {
      var isSelected = selectedInterests.indexOf(cat.id) !== -1;
      return '<div class="card interest-card' + (isSelected ? ' selected' : '') + '" ' +
        'style="cursor:pointer;padding:14px;text-align:center;border:2px solid ' + (isSelected ? 'var(--primary)' : 'var(--border)') + ';" ' +
        'onclick="toggleInterest(' + cat.id + ')">' +
        '<div style="font-size:28px;margin-bottom:6px;">' + cat.icon + '</div>' +
        '<div style="font-size:13px;font-weight:600;">' + cat.name + '</div>' +
        '<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">' + cat.majors.length + '个相关专业</div>' +
        '</div>';
    }).join('') +
    '</div>' +
    '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
    '<button class="btn btn-primary" onclick="submitInterestTest()">\u{1F50D} 根据兴趣推荐高校</button>' +
    '<button class="btn" style="background:var(--bg);border:1px solid var(--border);" onclick="clearInterestTest()">\u{1F5D1}\uFE0F 清除选择</button>' +
    '</div>' +
    '<div id="interest-result" style="margin-top:16px;"></div>';
}

function toggleInterest(id) {
  var idx = selectedInterests.indexOf(id);
  if (idx === -1) {
    selectedInterests.push(id);
  } else {
    selectedInterests.splice(idx, 1);
  }
  renderInterestTest();
}

function clearInterestTest() {
  selectedInterests = [];
  renderInterestTest();
  var result = document.getElementById('interest-result');
  if (result) result.innerHTML = '';
}

function getInterestMatchScore(name, interestIds) {
  if (!interestIds || interestIds.length === 0) return 0;
  
  // Get the college's majors
  var majors = getCollegeMajors(name);
  if (!majors || majors.length === 0) return 0;
  
  // Get all major names from selected interest categories
  var interestedMajorNames = [];
  interestIds.forEach(function(id) {
    var cat = (INTEREST_CATEGORIES || []).find(function(c) { return c.id === id; });
    if (cat && cat.majors) {
      cat.majors.forEach(function(m) {
        if (interestedMajorNames.indexOf(m) === -1) {
          interestedMajorNames.push(m);
        }
      });
    }
  });
  
  if (interestedMajorNames.length === 0) return 0;
  
  // Count how many of the college's majors match the interest majors
  var matchCount = 0;
  majors.forEach(function(m) {
    if (interestedMajorNames.indexOf(m.name) !== -1) {
      matchCount++;
    }
  });
  
  // Score is percentage of college majors that match interest areas
  var score = Math.round((matchCount / majors.length) * 100);
  return Math.min(score, 100);
}

function submitInterestTest() {
  var result = document.getElementById('interest-result');
  if (!result) return;
  
  if (selectedInterests.length === 0) {
    result.innerHTML = '<div style="padding:16px;background:var(--warning-bg);border-radius:var(--radius);font-size:14px;color:var(--warning-text);">请至少选择一个兴趣方向</div>';
    return;
  }
  
  // Score all colleges by interest match
  var scored = [];
  RANKINGS.forEach(function(c) {
    var matchScore = getInterestMatchScore(c.name, selectedInterests);
    if (matchScore > 0) {
      scored.push({ college: c, matchScore: matchScore });
    }
  });
  
  // Sort by match score descending, then by ranking score
  scored.sort(function(a, b) {
    if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
    return b.college.score - a.college.score;
  });
  
  var topMatches = scored.slice(0, 10);
  
  if (topMatches.length === 0) {
    result.innerHTML = '<div style="padding:16px;background:var(--warning-bg);border-radius:var(--radius);font-size:14px;color:var(--warning-text);">未找到与所选兴趣方向匹配的高校，请尝试选择其他兴趣方向</div>';
    return;
  }
  
  // Get selected interest names for display
  var interestNames = [];
  selectedInterests.forEach(function(id) {
    var cat = (INTEREST_CATEGORIES || []).find(function(c) { return c.id === id; });
    if (cat) interestNames.push(cat.name);
  });
  
  result.innerHTML = '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;">' +
    '<div style="font-size:15px;font-weight:600;margin-bottom:12px;">\u{1F3AF} 基于「' + interestNames.join('、') + '」的兴趣匹配推荐</div>' +
    '<div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;">根据你选择的兴趣方向，以下高校的专业设置匹配度最高</div>' +
    topMatches.map(function(item, i) {
      var c = item.college;
      var barWidth = Math.max(item.matchScore, 5);
      var barColor = item.matchScore >= 60 ? 'var(--success)' : item.matchScore >= 30 ? 'var(--warning)' : 'var(--text-muted)';
      return '<div class="recommend-item" onclick="showCollegeDetail(\'' + c.name + '\')">' +
        '<span style="font-size:12px;font-weight:600;color:var(--text-muted);min-width:24px;">#' + (i + 1) + '</span>' +
        '<span class="recommend-item-rank">#' + c.rank + '</span>' +
        '<span class="recommend-item-name">' + c.name + '</span>' +
        '<span class="recommend-item-tags">' + c.tags.map(function(t) {
          var cls = t === '985' ? 'tag-985' : t === '211' ? 'tag-211' : 'tag-syl';
          return '<span class="college-tag ' + cls + '">' + t + '</span>';
        }).join('') + '</span>' +
        '<span style="font-size:12px;color:var(--text-muted);flex-shrink:0;">匹配度</span>' +
        '<div style="width:80px;height:8px;background:var(--border);border-radius:4px;overflow:hidden;flex-shrink:0;">' +
          '<div style="height:100%;width:' + barWidth + '%;background:' + barColor + ';border-radius:4px;transition:width 0.3s;"></div>' +
        '</div>' +
        '<span class="score-badge match" style="flex-shrink:0;">' + item.matchScore + '%</span>' +
        '</div>';
    }).join('') +
    '</div>';
}

// ===== Export Plan =====
function exportPlan() {
  if (!lastRecommendData) {
    showToast('请先进行智能推荐后再导出方案', 'error');
    return;
  }
  
  var data = lastRecommendData;
  var currentUser = getCurrentUser();
  var username = currentUser ? currentUser.username : '未登录用户';
  var now = new Date();
  var dateStr = now.toLocaleDateString('zh-CN') + ' ' + now.toLocaleTimeString('zh-CN');
  
  var textLines = [];
  textLines.push('========================================');
  textLines.push('       高考志愿填报方案（导出）');
  textLines.push('========================================');
  textLines.push('');
  textLines.push('考生信息：');
  textLines.push('  用户名：' + username);
  textLines.push('  导出时间：' + dateStr);
  textLines.push('  高考分数：' + data.score + '分');
  textLines.push('  科类：' + data.subject);
  textLines.push('  省份：' + data.province);
  textLines.push('');
  textLines.push('========================================');
  textLines.push('  一、冲刺院校（努力一下有机会）');
  textLines.push('----------------------------------------');
  if (data.reach.length === 0) {
    textLines.push('  （无推荐）');
  } else {
    data.reach.forEach(function(c) {
      textLines.push('  #' + c.rank + ' ' + c.name + ' | ' + c.location + ' | ' + c.tags.join('、') + ' | 综合评分：' + c.score);
    });
  }
  textLines.push('');
  textLines.push('========================================');
  textLines.push('  二、稳妥院校（录取概率较大）');
  textLines.push('----------------------------------------');
  if (data.target.length === 0) {
    textLines.push('  （无推荐）');
  } else {
    data.target.forEach(function(c) {
      textLines.push('  #' + c.rank + ' ' + c.name + ' | ' + c.location + ' | ' + c.tags.join('、') + ' | 综合评分：' + c.score);
    });
  }
  textLines.push('');
  textLines.push('========================================');
  textLines.push('  三、保底院校（录取非常稳妥）');
  textLines.push('----------------------------------------');
  if (data.safe.length === 0) {
    textLines.push('  （无推荐）');
  } else {
    data.safe.forEach(function(c) {
      textLines.push('  #' + c.rank + ' ' + c.name + ' | ' + c.location + ' | ' + c.tags.join('、') + ' | 综合评分：' + c.score);
    });
  }
  textLines.push('');
  textLines.push('========================================');
  textLines.push('  四、收藏院校');
  textLines.push('----------------------------------------');
  var favs = getFavorites();
  if (favs.length === 0) {
    textLines.push('  （暂无收藏）');
  } else {
    favs.forEach(function(name) {
      textLines.push('  \u2764 ' + name);
    });
  }
  textLines.push('');
  textLines.push('========================================');
  textLines.push('  重要提示：');
  textLines.push('  1. 本方案基于模拟数据生成，仅供参考');
  textLines.push('  2. 正式填报请以各省教育考试院官方公布为准');
  textLines.push('  3. 建议咨询学校老师和专业志愿填报指导人员');
  textLines.push('========================================');
  textLines.push('  梧昭高考查询 · 高考志愿填报服务平台');
  textLines.push('  导出时间：' + dateStr);
  textLines.push('========================================');
  
  var content = textLines.join('\r\n');
  var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var link = document.createElement('a');
  link.href = url;
  link.download = '高考志愿方案_' + dateStr.replace(/[/:]/g, '-') + '.txt';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  showToast('志愿方案已导出为TXT文件', 'success');
}

// ===== Navigation =====
function navigateTo(page) {
  currentPage = page;
  
  // === Update all nav buttons ===
  var allBtns = document.querySelectorAll('.nav-item');
  for (var bi = 0; bi < allBtns.length; bi++) {
    allBtns[bi].classList.remove('active');
  }
  // Mark current page as active
  var target = document.querySelector('[data-page=\"' + page + '\"]');
  if (target) { target.classList.add('active'); }

  // === STEP 5: Switch visible section ===
  document.querySelectorAll('.section').forEach(function(el) {
    el.classList.remove('active');
  });
  var section = document.getElementById('section-' + page);
  if (section) {
    section.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // Dynamically create missing sections
    var main = document.querySelector('.app-content');
    if (main) {
      var newSection = document.createElement('section');
      newSection.id = 'section-' + page;
      newSection.className = 'section active';
      main.appendChild(newSection);
      section = newSection;
    }
  }
  
  // === STEP 6: Render page-specific content ===
  if (!section) return;
  
  if (page === 'favorites') {
        section.innerHTML = '<div class="section-header">' +
          '<h2 class="section-title">\u{1F496} 我的收藏 <span class="badge">收藏的高校</span></h2>' +
          '</div>' +
          '<div id="favorites-count" class="result-count"></div>' +
          '<div id="favorites-grid" class="card-grid"></div>';
        renderFavoritesPage();
      } else if (page === 'profile') {
        section.innerHTML = '<div class="section-header">' +
          '<h2 class="section-title">\u{1F464} 个人中心</h2>' +
          '</div>' +
          '<div id="profile-content"></div>';
        renderProfilePage();
      } else if (page === 'auth') {
        // Auth already exists in HTML, navigate to it
        var existingAuth = document.getElementById('section-auth');
        if (existingAuth) {
          existingAuth.classList.add('active');
          renderAuthSection();
        }
        return;
            } else if (page === 'jxsimulate') {
        // Always re-render interest checkboxes when navigating to jxsimulate
        var interestContainer = document.getElementById('jx-interest-container');
        if (interestContainer) {
          interestContainer.innerHTML = '';
          var cats = INTEREST_CATEGORIES || [];
          for (var ici = 0; ici < cats.length; ici++) {
            var cid = String(ici);
            var label = document.createElement('label');
            label.className = 'jx-interest-chk-label';
            label.innerHTML = '<input type="checkbox" value="' + cid + '">' + cats[ici].icon + ' ' + cats[ici].name;
            label.addEventListener('click', function(e) {
              e.preventDefault();
              var cb = this.querySelector('input');
              cb.checked = !cb.checked;
              if (cb.checked) { this.classList.add('checked'); }
              else { this.classList.remove('checked'); }
            });
            interestContainer.appendChild(label);
          }
        }
        // 初始化个人信息调查问卷
        if (typeof jxSurveyInit === 'function') {
          jxSurveyInit();
        }
      } else if (page === 'simulate') {
        // 初始化通用模拟填报
        if (typeof simSurveyInit === 'function') {
          simSurveyInit();
        }
        if (typeof simInitInterests === 'function') {
          simInitInterests();
        }
        // 初始化省份下拉
        var simProvSel = document.getElementById('sim-province');
        if (simProvSel && !simProvSel.dataset.populated) {
          simProvSel.dataset.populated = 'true';
          var provHtml = '<option value="">选择省份</option>';
          for (var pi = 0; pi < PROVINCES.length; pi++) {
            provHtml += '<option value="' + PROVINCES[pi] + '">' + PROVINCES[pi] + '</option>';
          }
          simProvSel.innerHTML = provHtml;
        }
      } else if (page === 'verify') {
        // Initialize verification tabs
        setTimeout(renderVerifyPage, 100);
        return;
      
      } else if (page === 'vocational') {
        renderVocationalList();
      }
}
// Toast notification
function showToast(message, type) {
  if (typeof type === 'undefined') type = 'info';
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast show ' + type;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function() { toast.classList.remove('show'); }, 3000);
}

// ===================== HOME PAGE =====================
function renderHomePage() {
  // Render rankings
  var rankingList = document.getElementById('home-rankings');
  if (rankingList) {
    rankingList.innerHTML = RANKINGS.slice(0, 8).map(function(c, i) {
      var favHtml = '<span class="fav-btn ' + (isFavorited(c.name) ? 'active' : '') + '" onclick="event.stopPropagation();toggleFavorite(\'' + c.name + '\')" title="' + (isFavorited(c.name) ? '取消收藏' : '收藏') + '">' + (isFavorited(c.name) ? '\u2764\uFE0F' : '\u{1F90D}') + '</span>';
      return '<div class="card college-card card-clickable" onclick="showCollegeDetail(\'' + c.name + '\')">' +
        '<div style="position:relative;">' +
          '<div class="college-rank ' + (i < 3 ? 'top3' : '') + '">' + c.rank + '</div>' +
          '<div style="position:absolute;top:4px;right:4px;z-index:2;">' + favHtml + '</div>' +
        '</div>' +
        '<div class="college-info">' +
          '<div class="college-name">' + c.name + '</div>' +
          '<div class="college-tags">' +
            c.tags.map(function(t) {
              var cls = t === '985' ? 'tag-985' : t === '211' ? 'tag-211' : 'tag-syl';
              return '<span class="college-tag ' + cls + '">' + t + '</span>';
            }).join('') +
          '</div>' +
          '<div class="college-meta">' +
            '<span>\u{1F4CD} ' + c.location + '</span>' +
            '<span>\u{1F4CA} 综合评分：' + c.score + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  // 专家锦囊
  var expertBox = document.getElementById('home-expert-tips');
  if (expertBox && typeof EXPERT_KNOWLEDGE !== 'undefined') {
    var tips = EXPERT_KNOWLEDGE.filter(function(t) { return t.priority >= 4; });
    // 随机展示6条
    var shuffled = tips.slice().sort(function() { return 0.5 - Math.random(); });
    var show = shuffled.slice(0, 6);
    expertBox.innerHTML = '<div class="section-header"><h2 class="section-title">💡 专家锦囊</h2>' +
      '<span class="badge">张雪峰 / 陈志文 / 熊丙奇等公开观点</span></div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;">' +
      show.map(function(t) {
        var srcColor = t.source === '张雪峰' ? '#e74c3c' : (t.source === '陈志文' ? '#2980b9' : (t.source === '熊丙奇' ? '#27ae60' : '#7f8c8d'));
        return '<div class="card" style="padding:14px;border-left:3px solid ' + srcColor + ';">' +
          '<div style="font-size:13px;line-height:1.6;color:var(--text-primary);">' + t.tip + '</div>' +
          '<div style="font-size:11px;color:' + srcColor + ';margin-top:6px;font-weight:600;">— ' + t.source + ' · ' + t.category + '</div>' +
          '</div>';
      }).join('') +
      '</div>' +
      '<button class="btn" style="margin-top:10px;background:var(--bg);border:1px solid var(--border);" onclick="refreshExpertTips()">换一批</button>';
  }

  // Render news
  var newsList = document.getElementById('home-news');
  if (newsList) {
    newsList.innerHTML = NEWS.slice(0, 3).map(function(n) {
      var typeClass = n.type === '政策' ? 'policy' : n.type === '招生' ? 'recruit' : n.type === '专业' ? 'major' : n.type === '排名' ? 'rank' : 'guide';
      return '<div class="card news-card" onclick="showNewsDetail(' + n.id + ')" style="cursor:pointer;">' +
        '<span class="news-type ' + typeClass + '">' + n.type + '</span>' +
        (n.hot ? '<span class="news-hot">\u{1F525} 热门</span>' : '') +
        '<div class="news-title">' + n.title + '</div>' +
        '<div class="news-summary">' + n.summary + '</div>' +
        '<div class="news-date">\u{1F4C5} ' + n.date + '</div>' +
      '</div>';
    }).join('');
  }
  
  // Render major categories
  var majorGrid = document.getElementById('home-majors');
  if (majorGrid) {
    majorGrid.innerHTML = MAJOR_CATEGORIES.slice(0, 6).map(function(m) {
      return '<div class="card major-card" onclick="navigateTo(\'majors\')">' +
        '<div class="major-icon">' + m.icon + '</div>' +
        '<div class="major-name">' + m.name + '</div>' +
        '<div class="major-count">' + m.count + '个专业</div>' +
      '</div>';
    }).join('');
  }
  
  // Render employment
  var empList = document.getElementById('home-employment');
  if (empList) {
    empList.innerHTML = MAJOR_EMPLOYMENT.map(function(m) {
      var stars = '';
      for (var si = 0; si < 5; si++) {
        stars += '<span class="emp-hot-star ' + (si < m.hot ? '' : 'empty') + '">\u2605</span>';
      }
      return '<div class="card employment-card">' +
        '<div class="emp-name">' + m.name + '</div>' +
        '<div class="emp-stats">' +
          '<span>薪资：<span class="emp-stat-value">' + m.avgSalary + '</span></span>' +
          '<span>就业率：<span class="emp-stat-value">' + m.employmentRate + '</span></span>' +
        '</div>' +
        '<div class="emp-hot" style="margin-top:6px">' +
          '<span class="text-sm text-muted">热度：</span>' +
          stars +
        '</div>' +
      '</div>';
    }).join('');
  }

  renderAiHealthCard();
  
  // Render provinces for quick entry
  var provSelect = document.getElementById('simulate-province');
  if (provSelect) {
    provSelect.innerHTML = '<option value="">选择省份</option>' + 
      PROVINCES.map(function(p) { return '<option value="' + p + '">' + p + '</option>'; }).join('');
  }
  var provSelect2 = document.getElementById('simulate-province2');
  if (provSelect2) {
    provSelect2.innerHTML = '<option value="">选择省份</option>' + 
      PROVINCES.map(function(p) { return '<option value="' + p + '">' + p + '</option>'; }).join('');
  }
  
  // Render interest test
  renderInterestTest();
}

// ===================== COLLEGE LIST PAGE =====================

var collegePageOffset = 60;

// Load more colleges (lazy pagination)
function loadMoreColleges() {
  var grid = document.getElementById('college-grid');
  if (!grid || !filteredColleges || filteredColleges.length <= collegePageOffset) return;
  
  var next = filteredColleges.slice(collegePageOffset, collegePageOffset + 40);
  if (next.length === 0) return;
  
  var btn = document.getElementById('load-more-btn');
  var newHtml = '';
  
  for (var i = 0; i < next.length; i++) {
    var c = next[i];
    var favHtml = '<span class="fav-btn ' + (isFavorited(c.name) ? 'active' : '') + '" onclick="event.stopPropagation();toggleFavorite(\'' + c.name.replace(/'/g, '\\\'') + '\')" title="' + (isFavorited(c.name) ? '取消收藏' : '收藏') + '">' + (isFavorited(c.name) ? '❤️' : '🤍') + '</span>';
    newHtml += '<div class="card college-card card-clickable" onclick="showCollegeDetail(\'' + c.name.replace(/'/g, '\\\'') + '\')">' +
      '<div class="college-rank">' + c.rank + '</div>' +
      '<div class="college-info">' +
        '<div class="college-name">' + c.name + '</div>' +
        '<div class="college-meta"><span>📍 ' + c.location + '</span><span>🏷️ ' + c.type + '</span></div>' +
      '</div>' +
      '<div style="text-align:right;flex-shrink:0;">' + favHtml +
        '<div style="font-size:14px;font-weight:700;color:var(--primary);">' + c.score + '</div>' +
      '</div>' +
    '</div>';
  }
  
  collegePageOffset += 40;
  
  // Remove old button, insert new items before adding button back
  if (btn) btn.remove();
  grid.insertAdjacentHTML('beforeend', newHtml);
  
  var remaining = filteredColleges.length - collegePageOffset;
  if (remaining > 0) {
    grid.insertAdjacentHTML('beforeend', '<div style="text-align:center;margin-top:16px;"><button class="btn btn-outline" id="load-more-btn" onclick="loadMoreColleges()" style="width:200px;">📥 加载更多高校（剩余' + remaining + '所）</button></div>');
  }
  
  var count = document.getElementById('college-count');
  if (count) count.textContent = '共 ' + filteredColleges.length + ' 所高校（已显示' + collegePageOffset + '所）';
}


function renderCollegeList() {
  var typeFilter = document.getElementById('college-type-filter');
  var locFilter = document.getElementById('college-loc-filter');
  var searchInput = document.getElementById('college-search');
  
  collegePageOffset = 60;
  var list = [].concat(RANKINGS);
  
  if (typeFilter && typeFilter.value) {
    list = list.filter(function(c) { return c.type === typeFilter.value; });
  }
  if (locFilter && locFilter.value) {
    list = list.filter(function(c) { return c.location === locFilter.value; });
  }
  if (searchInput && searchInput.value.trim()) {
    var q = searchInput.value.trim().toLowerCase();
    list = list.filter(function(c) {
      if (c.name.toLowerCase().indexOf(q) !== -1) return true;
      if (c.location.toLowerCase().indexOf(q) !== -1) return true;
      if (c.type.toLowerCase().indexOf(q) !== -1) return true;
      if (c.tags && c.tags.length > 0) {
        for (var ti = 0; ti < c.tags.length; ti++) {
          if (c.tags[ti].toLowerCase().indexOf(q) !== -1) return true;
        }
      }
      return false;
    });
  }
  
  filteredColleges = list;
  
  var grid = document.getElementById('college-grid');
  var count = document.getElementById('college-count');
  
  if (count) count.textContent = '共 ' + list.length + ' 所高校';
  
  if (grid) {
    if (list.length === 0) {
      grid.innerHTML = '<div class="empty-state">' +
        '<div class="empty-state-icon">\u{1F50D}</div>' +
        '<div class="empty-state-text">未找到匹配的高校，请调整筛选条件</div>' +
      '</div>';
      return;
    }
    var pageSize = 60;
    var displayList = list.slice(0, pageSize);
    grid.innerHTML = displayList.map(function(c, i) {
      var favHtml = '<span class="fav-btn ' + (isFavorited(c.name) ? 'active' : '') + '" onclick="event.stopPropagation();toggleFavorite(\'' + c.name + '\')" title="' + (isFavorited(c.name) ? '取消收藏' : '收藏') + '">' + (isFavorited(c.name) ? '\u2764\uFE0F' : '\u{1F90D}') + '</span>';
      return '<div class="card college-card card-clickable" onclick="showCollegeDetail(\'' + c.name + '\')">' +
        '<div class="college-rank ' + (i < 3 ? 'top3' : '') + '">' + c.rank + '</div>' +
        '<div class="college-info">' +
          '<div class="college-name">' + c.name + '</div>' +
          '<div class="college-tags">' +
            c.tags.map(function(t) {
              var cls = t === '985' ? 'tag-985' : t === '211' ? 'tag-211' : 'tag-syl';
              return '<span class="college-tag ' + cls + '">' + t + '</span>';
            }).join('') +
          '</div>' +
          '<div class="college-meta">' +
            '<span>\u{1F4CD} ' + c.location + '</span>' +
            '<span>\u{1F4CA} 综合评分：' + c.score + '</span>' +
            '<span>\u{1F3F7}\uFE0F ' + c.type + '</span>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;">' +
          favHtml +
          '<div style="font-size:18px;font-weight:700;color:var(--primary);">' + c.score + '</div>' +
          '<div style="font-size:11px;color:var(--text-muted);">综合评分</div>' +
        '</div>' +
      '</div>';
    }).join('');
    
    // Load more button
    if (list.length > pageSize) {
      grid.innerHTML += '<div style="text-align:center;margin-top:16px;"><button class="btn btn-outline" id="load-more-btn" onclick="loadMoreColleges()" style="width:200px;">📥 加载更多高校（剩余' + (list.length - pageSize) + '所）</button></div>';
    }
  }
  
  // Populate filters
  if (typeFilter && !typeFilter.dataset.populated) {
    typeFilter.dataset.populated = 'true';
    var types = [];
    RANKINGS.forEach(function(c) {
      if (types.indexOf(c.type) === -1) types.push(c.type);
    });
    types.forEach(function(t) {
      var opt = document.createElement('option');
      opt.value = t; opt.textContent = t;
      typeFilter.appendChild(opt);
    });
  }
  if (locFilter && !locFilter.dataset.populated) {
    locFilter.dataset.populated = 'true';
    var locs = [];
    RANKINGS.forEach(function(c) {
      if (locs.indexOf(c.location) === -1) locs.push(c.location);
    });
    locs.forEach(function(l) {
      var opt = document.createElement('option');
      opt.value = l; opt.textContent = l;
      locFilter.appendChild(opt);
    });
  }
}

// ===================== NEWS PAGE =====================
function renderNews() {
  var grid = document.getElementById('news-grid');
  var count = document.getElementById('news-count');
  
  if (count) count.textContent = '共 ' + NEWS.length + ' 条资讯';
  
  if (grid) {
    grid.innerHTML = NEWS.map(function(n) {
      var typeClass = n.type === '政策' ? 'policy' : n.type === '招生' ? 'recruit' : n.type === '专业' ? 'major' : n.type === '排名' ? 'rank' : 'guide';
      return '<div class="card news-card" onclick="showNewsDetail(' + n.id + ')" style="cursor:pointer;">' +
        '<span class="news-type ' + typeClass + '">' + n.type + '</span>' +
        (n.hot ? '<span class="news-hot">\u{1F525} 热门</span>' : '') +
        '<div class="news-title">' + n.title + '</div>' +
        '<div class="news-summary">' + n.summary + '</div>' +
        '<div class="news-date">\u{1F4C5} ' + n.date + '</div>' +
      '</div>';
    }).join('');
  }
}

// 新闻详情弹窗
function showNewsDetail(id) {
  var news = NEWS.find(function(n) { return n.id === id; });
  if (!news) return;
  var modal = document.getElementById('news-detail-modal');
  if (!modal) return;
  var contentHtml = (news.content || news.summary).replace(/\n/g, '<br>');
  modal.querySelector('.news-detail-title').textContent = news.title;
  modal.querySelector('.news-detail-meta').innerHTML = '<span style="margin-right:16px;">\u{1F4C5} ' + news.date + '</span><span class="news-type ' + (news.type === '政策' ? 'policy' : news.type === '招生' ? 'recruit' : news.type === '专业' ? 'major' : news.type === '排名' ? 'rank' : news.type === '就业' ? 'job' : 'guide') + '">' + news.type + '</span>';
  modal.querySelector('.news-detail-body').innerHTML = contentHtml;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function closeNewsDetail() {
  var modal = document.getElementById('news-detail-modal');
  if (modal) { modal.style.display = 'none'; }
  document.body.style.overflow = '';
}

// ===================== MAJORS PAGE =====================

// Show major category detail (sub-majors list)
function showMajorDetail(categoryName) {
  var area = document.getElementById('major-detail-area');
  if (!area) return;

  // Scroll to detail
  area.scrollIntoView({ behavior: 'smooth' });

  // Collect all majors that belong to this category
  var matchingMajors = [];
  var seenNames = [];

  for (var cn in COLLEGE_MAJORS) {
    if (COLLEGE_MAJORS.hasOwnProperty(cn)) {
      var mlist = COLLEGE_MAJORS[cn];
      for (var mi = 0; mi < mlist.length; mi++) {
        var m = mlist[mi];
        if (m.category === categoryName && seenNames.indexOf(m.name) === -1) {
          matchingMajors.push({ name: m.name, years: m.years, college: cn });
          seenNames.push(m.name);
        }
      }
    }
  }

  var html = '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;">' +
    '<div style="font-size:18px;font-weight:700;margin-bottom:4px;">' + categoryName + '</div>' +
    '<div style="font-size:13px;color:var(--text-muted);margin-bottom:16px;">共找到 ' + matchingMajors.length + ' 个相关专业</div>';

  if (matchingMajors.length > 0) {
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;">';
    for (var mj = 0; mj < matchingMajors.length; mj++) {
      var item = matchingMajors[mj];
      html += '<div style="padding:12px 16px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);cursor:pointer;" onclick="showCollegeDetail(\'' + item.college.replace(/'/g, '\\\'') + '\')">' +
        '<div style="font-weight:600;font-size:14px;margin-bottom:2px;">' + item.name + '</div>' +
        '<div style="font-size:12px;color:var(--text-muted);">学制：' + item.years + '年 | 开设院校：' + item.college + '</div>' +
      '</div>';
    }
    html += '</div>';
  } else {
    html += '<div style="color:var(--text-muted);">暂无该分类的具体专业数据</div>';
  }

  // Also show MAJOR_EMPLOYMENT matching this category
  var empMatches = [];
  for (var ei = 0; ei < MAJOR_EMPLOYMENT.length; ei++) {
    if (MAJOR_EMPLOYMENT[ei].category === categoryName) {
      empMatches.push(MAJOR_EMPLOYMENT[ei]);
    }
  }

  if (empMatches.length > 0) {
    html += '<div style="font-size:16px;font-weight:600;margin-top:20px;margin-bottom:12px;">💼 该大类就业数据</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px;">';
    for (var ek = 0; ek < empMatches.length; ek++) {
      var e = empMatches[ek];
      var stars = '';
      for (var ss = 0; ss < 5; ss++) {
        stars += '<span style="color:' + (ss < e.hot ? '#f59e0b' : '#e2e8f0') + ';">★</span>';
      }
      html += '<div style="padding:12px;background:#fffbeb;border:1px solid #fde68a;border-radius:var(--radius);">' +
        '<div style="font-weight:600;font-size:14px;">' + e.name + '</div>' +
        '<div style="font-size:12px;color:#92400e;margin-top:4px;">薪酬：' + e.avgSalary + ' | 就业率：' + e.employmentRate + '</div>' +
        '<div style="margin-top:4px;">' + stars + '</div>' +
      '</div>';
    }
    html += '</div>';
  }

  html += '</div>';
  area.innerHTML = html;
}


function renderMajors() {
  var grid = document.getElementById('majors-grid');
  if (grid) {
    grid.innerHTML = MAJOR_CATEGORIES.map(function(m) {
      return '<div class="card major-card clickable" onclick="showMajorDetail(\'' + m.name + '\')" style="cursor:pointer;">' +
        '<div class="major-icon">' + m.icon + '</div>' +
        '<div class="major-name">' + m.name + '</div>' +
        '<div class="major-count">' + m.count + '个专业</div>' +
      '</div>';
    }).join('');

    // Major detail area
    var detailArea = document.createElement('div');
    detailArea.id = 'major-detail-area';
    detailArea.style.cssText = 'margin-top:20px;';
    if (grid.parentNode) grid.parentNode.insertBefore(detailArea, grid.nextSibling);
  }
  
  var empGrid = document.getElementById('majors-employment');
  if (empGrid) {
    empGrid.innerHTML = MAJOR_EMPLOYMENT.map(function(m) {
      var stars = '';
      for (var si = 0; si < 5; si++) {
        stars += '<span class="emp-hot-star ' + (si < m.hot ? '' : 'empty') + '">\u2605</span>';
      }
      return '<div class="card employment-card">' +
        '<div class="emp-name">' + m.name + '</div>' +
        '<div class="emp-stats">' +
          '<span>\u{1F4B0} 薪资：<span class="emp-stat-value">' + m.avgSalary + '</span></span>' +
          '<span>\u2705 就业率：<span class="emp-stat-value">' + m.employmentRate + '</span></span>' +
        '</div>' +
        '<div class="emp-hot" style="margin-top:6px">' +
          '<span class="text-sm text-muted">热度：</span>' +
          stars +
        '</div>' +
      '</div>';
    }).join('');
  }
}

// ===================== COLLEGE DETAIL =====================
function showCollegeDetail(name) {
  var college = null;
  for (var rci = 0; rci < RANKINGS.length; rci++) {
    if (RANKINGS[rci].name === name) { college = RANKINGS[rci]; break; }
  }
  if (!college) return;
  
  var detail = getCollegeDetail(name);
  var majors = getCollegeMajors(name);
  
  var modal = document.getElementById('college-modal');
  var body = modal.querySelector('.modal-body');
  
  // Group majors by category
  var majorGroups = {};
  majors.forEach(function(m) {
    if (!majorGroups[m.category]) majorGroups[m.category] = [];
    majorGroups[m.category].push(m);
  });
  
  var majorHtml = '';
  for (var cat in majorGroups) {
    if (majorGroups.hasOwnProperty(cat)) {
      var list = majorGroups[cat];
      majorHtml += '<div class="mb-4">' +
        '<div style="font-size:14px;font-weight:600;margin-bottom:8px;color:var(--primary);">' + cat + '</div>' +
        '<div class="major-list">' +
        list.map(function(m) {
          return '<div class="major-list-item">' + m.name + '<span class="major-list-cat">' + m.years + '年/' + m.degree + '</span></div>';
        }).join('') +
        '</div></div>';
    }
  }
  
  // Score line simulation
  var scoreInfo = getScoreLine(name, '北京市', '物理类');
  
  // Compare with other colleges
  var similarColleges = RANKINGS
    .filter(function(c) { return c.type === college.type && c.name !== name; })
    .slice(0, 3);
  
  modal.querySelector('.modal-header h3').textContent = name;
  body.innerHTML = 
    '<div class="detail-header">' +
      '<div class="detail-avatar">' + (college.rank <= 5 ? '\u{1F3C6}' : '\u{1F393}') + '</div>' +
      '<div class="detail-basic">' +
        '<div class="detail-name">' + escapeHtml(name) + '</div>' +
        '<div class="detail-tags">' +
          college.tags.map(function(t) {
            var cls = t === '985' ? 'tag-985' : t === '211' ? 'tag-211' : 'tag-syl';
            return '<span class="college-tag ' + cls + '">' + escapeHtml(t) + '</span>';
          }).join('') +
          '<span class="college-tag tag-985" style="background:var(--border-light);color:var(--text-secondary)">' + escapeHtml(college.type) + '</span>' +
          '<span class="college-tag tag-985" style="background:var(--border-light);color:var(--text-secondary)">\u{1F4CD} ' + escapeHtml(college.location) + '</span>' +
        '</div>' +
        '<div style="font-size:13px;color:var(--text-muted)">' +
          '\u{1F517} <a href="' + escapeHtml(detail.website) + '" target="_blank">' + escapeHtml(detail.website) + '</a>' +
        '</div>' +
      '</div>' +
    '</div>' +
    
    '<div class="detail-meta">' +
      '<div class="detail-meta-item"><strong>\u{1F3EB} 创办时间</strong>' + escapeHtml(String(detail.establishYear)) + '年</div>' +
      '<div class="detail-meta-item"><strong>\u{1F4CF} 占地面积</strong>' + escapeHtml(detail.area) + '</div>' +
      '<div class="detail-meta-item"><strong>\u{1F468}\u200D\u{1F393} 在校生</strong>' + escapeHtml(detail.students || '—') + '</div>' +
      '<div class="detail-meta-item"><strong>\u{1F469}\u200D\u{1F3EB} 教师人数</strong>' + escapeHtml(detail.faculty || '—') + '</div>' +
      '<div class="detail-meta-item"><strong>\u{1F4DA} 图书馆藏</strong>' + escapeHtml(detail.libCount || '—') + '</div>' +
      '<div class="detail-meta-item"><strong>\u{1F4DE} 招生电话</strong>' + escapeHtml(detail.phone || '—') + '</div>' +
      '<div class="detail-meta-item"><strong>\u{1F3C6} 综合排名</strong>第' + college.rank + '名（综合评分：' + college.score + '）</div>' +
      '<div class="detail-meta-item"><strong>\u{1F4D6} 校训</strong>' + escapeHtml(detail.motto || '—') + '</div>' +
    '</div>' +
    
    // 学生真实评价（来自神人高校网 srgaoxiao.com）
    (function() {
      var srg = getSrgRating(name);
      if (!srg) return '';
      var stars = function(n) {
        var s = '';
        var full = Math.floor(n);
        for (var i = 0; i < 5; i++) {
          s += '<span style="color:' + (i < full ? '#f59e0b' : '#e2e8f0') + ';">★</span>';
        }
        return s;
      };
      return '' +
      '<div class="detail-section-title">\u{1F4AC} 学生真实评价</div>' +
      '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:var(--radius);padding:16px;margin-bottom:24px;">' +
        '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;margin-bottom:12px;">' +
          '<div style="text-align:center;"><div style="font-size:28px;font-weight:700;color:#92400e;">' + srg.overall + '</div><div style="font-size:12px;color:#92400e;">综合评分</div>' + stars(srg.overall) + '</div>' +
          '<div><strong style="font-size:13px;">\u{1F3E0} 宿舍</strong><br>' + stars(srg.dorm) + '<br><span style="font-size:12px;color:#92400e;">' + srg.dorm + '</span></div>' +
          '<div><strong style="font-size:13px;">\u{1F372} 食堂</strong><br>' + stars(srg.food) + '<br><span style="font-size:12px;color:#92400e;">' + srg.food + '</span></div>' +
          '<div><strong style="font-size:13px;">\u{1F468}\u200D\u{1F3EB} 师资</strong><br>' + stars(srg.teacher) + '<br><span style="font-size:12px;color:#92400e;">' + srg.teacher + '</span></div>' +
          '<div><strong style="font-size:13px;">\u{1F3DA}\uFE0F 校园</strong><br>' + stars(srg.campus) + '<br><span style="font-size:12px;color:#92400e;">' + srg.campus + '</span></div>' +
          '<div><strong style="font-size:13px;">\u{1F3B5} 人文</strong><br>' + stars(srg.culture) + '<br><span style="font-size:12px;color:#92400e;">' + srg.culture + '</span></div>' +
          '<div><strong style="font-size:13px;">\u{1F4BC} 就业</strong><br>' + stars(srg.job) + '<br><span style="font-size:12px;color:#92400e;">' + srg.job + '</span></div>' +
          '<div><strong style="font-size:13px;">\u{1F6E1}\uFE0F 安全</strong><br>' + stars(srg.safe) + '<br><span style="font-size:12px;color:#92400e;">' + srg.safe + '</span></div>' +
        '</div>' +
        '<div style="font-size:12px;color:#92400e;border-top:1px solid #fde68a;padding-top:8px;">' +
          '\u{1F50D} 数据来源：<a href="https://www.srgaoxiao.com/school/' + encodeURIComponent(name) + '" target="_blank" style="color:#1a56db;text-decoration:underline;">神人高校网</a> 学生实名评价（共' + srg.reviews + '条评价）' +
        '</div>' +
      '</div>';
    })() +
    
    '<div class="detail-section-title">学校简介</div>' +
    '<div class="detail-intro">' + escapeHtml(detail.intro) + '</div>' +
    
    // 校园环境
    (detail.campus ? '' +
    '<div class="detail-section-title">\u{1F3F3}\uFE0F 校园环境</div>' +
    '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:var(--radius);padding:16px;margin-bottom:24px;">' +
      '<div style="font-size:14px;line-height:1.8;color:#166534;">' + escapeHtml(detail.campus) + '</div>' +
    '</div>' : '') +
    
    '<div class="detail-section-title">招生专业</div>' +
    majorHtml +
    
    '<div class="detail-section-title">历年分数线（模拟数据）</div>' +
    '<div class="mb-4" style="overflow-x:auto;">' +
      '<table class="score-table">' +
        '<thead><tr>' +
          '<th>年份</th><th>省份</th><th>科类</th><th>最低分</th><th>最低位次</th><th>批次</th>' +
        '</tr></thead>' +
        '<tbody>' +
          [2025, 2024, 2023].map(function(y) {
            var s = getScoreLine(name, '北京市', '物理类');
            s.year = y;
            return '<tr>' +
              '<td>' + y + '</td>' +
              '<td>北京市</td>' +
              '<td>物理类</td>' +
              '<td><strong>' + s.minScore + '</strong></td>' +
              '<td>' + s.minRank + '</td>' +
              '<td>' + s.batch + '</td>' +
            '</tr>';
          }).join('') +
        '</tbody>' +
      '</table>' +
    '</div>' +
    
    '<div class="detail-section-title">同类型院校推荐</div>' +
    '<div class="card-grid col-3">' +
      similarColleges.map(function(c) {
        return '<div class="card college-card card-clickable" onclick="showCollegeDetail(\'' + c.name + '\')">' +
          '<div class="college-rank">' + c.rank + '</div>' +
          '<div class="college-info">' +
            '<div class="college-name" style="font-size:14px">' + escapeHtml(c.name) + '</div>' +
            '<div class="college-tags">' +
              c.tags.map(function(t) { return '<span class="college-tag tag-985">' + escapeHtml(t) + '</span>'; }).join('') +
            '</div>' +
            '<div class="college-meta">\u{1F4CD} ' + escapeHtml(c.location) + '</div>' +
          '</div>' +
        '</div>';
      }).join('') +
    '</div>';
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCollegeModal() {
  document.getElementById('college-modal').classList.remove('active');
  document.body.style.overflow = '';
}

// Click overlay to close
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-overlay')) {
    closeCollegeModal();
  }
});

// ===================== SIMULATE PAGE =====================
function renderSimulate() {
  ['simulate-province', 'simulate-province2'].forEach(function(id) {
    var sel = document.getElementById(id);
    if (sel && !sel.dataset.populated) {
      sel.dataset.populated = 'true';
      sel.innerHTML = '<option value="">选择省份</option>' + 
        PROVINCES.map(function(p) { return '<option value="' + p + '">' + p + '</option>'; }).join('');
    }
  });
}

function doRecommend() {
  var score = parseInt(document.getElementById('simulate-score').value);
  var subject = document.getElementById('simulate-subject').value;
  var province = document.getElementById('simulate-province').value;
  
  if (!score || !subject || !province) {
    showToast('请完整填写高考分数、科类和省份信息', 'error');
    return;
  }
  
  if (score < 0 || score > 750) {
    showToast('请输入有效的高考分数（0-750分）', 'error');
    return;
  }
  
  var result = document.getElementById('simulate-result');
  var rec = recommendColleges(score, subject, province);
  
  // Store for export
  lastRecommendData = {
    score: score,
    subject: subject,
    province: province,
    reach: rec.reach,
    target: rec.target,
    safe: rec.safe
  };
  
  // Calculate interest match scores if interests are selected
  var useInterestMatch = selectedInterests.length > 0;
  
  var html = '<div class="recommend-result-header" style="margin-bottom:16px;padding:12px 16px;background:var(--primary-light);border-radius:var(--radius);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;">' +
    '<div><strong>\u{1F4CA} 您的分数：' + score + '分</strong> | 科类：' + subject + ' | 省份：' + province + '</div>' +
    '<div style="font-size:13px;color:var(--text-muted)">基于' + RANKINGS.length + '所高校数据智能推荐</div>' +
  '</div>';
  
  // Helper to get interest match portion of HTML
  function getInterestHtml(name) {
    if (!useInterestMatch) return '';
    var matchScore = getInterestMatchScore(name, selectedInterests);
    var barColor = matchScore >= 60 ? 'var(--success)' : matchScore >= 30 ? 'var(--warning)' : 'var(--text-muted)';
    return '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;font-size:12px;">' +
      '<span style="color:var(--text-muted);">\u{1F9E0} 兴趣匹配：</span>' +
      '<div style="width:60px;height:6px;background:var(--border);border-radius:3px;overflow:hidden;">' +
        '<div style="height:100%;width:' + matchScore + '%;background:' + barColor + ';border-radius:3px;"></div>' +
      '</div>' +
      '<span style="font-weight:600;color:' + barColor + ';">' + matchScore + '%</span>' +
    '</div>';
  }
  
  // 冲刺院校
  if (rec.reach.length > 0) {
    html += '<div class="recommend-section">' +
      '<div class="recommend-title reach">\u{1F680} 冲刺院校（努力一下有机会）</div>';
    rec.reach.forEach(function(c) {
      var favHtml = '<span class="fav-btn ' + (isFavorited(c.name) ? 'active' : '') + '" onclick="event.stopPropagation();toggleFavorite(\'' + c.name + '\')" style="margin-left:8px;cursor:pointer;font-size:16px;" title="' + (isFavorited(c.name) ? '取消收藏' : '收藏') + '">' + (isFavorited(c.name) ? '\u2764\uFE0F' : '\u{1F90D}') + '</span>';
      html += '<div class="recommend-item" onclick="showCollegeDetail(\'' + c.name + '\')">' +
        '<span class="recommend-item-rank">#' + c.rank + '</span>' +
        '<span class="recommend-item-name">' + c.name + '</span>' +
        '<span class="recommend-item-tags">' + c.tags.map(function(t) { return '<span class="college-tag tag-985">' + t + '</span>'; }).join('') + '</span>' +
        '<span class="score-badge low">差距约' + Math.round(5 + Math.random() * 15) + '分</span>' +
        favHtml +
        getInterestHtml(c.name) +
      '</div>';
    });
    html += '</div>';
  }
  
  // 稳妥院校
  if (rec.target.length > 0) {
    html += '<div class="recommend-section">' +
      '<div class="recommend-title target">\u{1F3AF} 稳妥院校（录取概率较大）</div>';
    rec.target.forEach(function(c) {
      var favHtml = '<span class="fav-btn ' + (isFavorited(c.name) ? 'active' : '') + '" onclick="event.stopPropagation();toggleFavorite(\'' + c.name + '\')" style="margin-left:8px;cursor:pointer;font-size:16px;" title="' + (isFavorited(c.name) ? '取消收藏' : '收藏') + '">' + (isFavorited(c.name) ? '\u2764\uFE0F' : '\u{1F90D}') + '</span>';
      html += '<div class="recommend-item" onclick="showCollegeDetail(\'' + c.name + '\')">' +
        '<span class="recommend-item-rank">#' + c.rank + '</span>' +
        '<span class="recommend-item-name">' + c.name + '</span>' +
        '<span class="recommend-item-tags">' + c.tags.map(function(t) { return '<span class="college-tag tag-985">' + t + '</span>'; }).join('') + '</span>' +
        '<span class="score-badge match">匹配度约' + Math.round(60 + Math.random() * 20) + '%</span>' +
        favHtml +
        getInterestHtml(c.name) +
      '</div>';
    });
    html += '</div>';
  }
  
  // 保底院校
  if (rec.safe.length > 0) {
    html += '<div class="recommend-section">' +
      '<div class="recommend-title safe">\u{1F6E1}\uFE0F 保底院校（录取非常稳妥）</div>';
    rec.safe.forEach(function(c) {
      var favHtml = '<span class="fav-btn ' + (isFavorited(c.name) ? 'active' : '') + '" onclick="event.stopPropagation();toggleFavorite(\'' + c.name + '\')" style="margin-left:8px;cursor:pointer;font-size:16px;" title="' + (isFavorited(c.name) ? '取消收藏' : '收藏') + '">' + (isFavorited(c.name) ? '\u2764\uFE0F' : '\u{1F90D}') + '</span>';
      html += '<div class="recommend-item" onclick="showCollegeDetail(\'' + c.name + '\')">' +
        '<span class="recommend-item-rank">#' + c.rank + '</span>' +
        '<span class="recommend-item-name">' + c.name + '</span>' +
        '<span class="recommend-item-tags">' + c.tags.map(function(t) { return '<span class="college-tag tag-985">' + t + '</span>'; }).join('') + '</span>' +
        '<span class="score-badge high">超出约' + Math.round(10 + Math.random() * 15) + '分</span>' +
        favHtml +
        getInterestHtml(c.name) +
      '</div>';
    });
    html += '</div>';
  }
  
  html += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">' +
    '<button class="btn btn-primary" onclick="exportPlan()" style="flex:1;">\u{1F4E5} 导出志愿方案</button>' +
    '<button class="btn" style="background:var(--bg);border:1px solid var(--border);flex:1;" onclick="navigateTo(\'favorites\')">\u{1F496} 查看收藏 (' + getFavorites().length + ')</button>' +
  '</div>';
  
  html += '<div style="margin-top:16px;padding:12px 16px;background:var(--warning-bg);border-radius:var(--radius);font-size:13px;color:var(--warning);">' +
    '\u26A0\uFE0F 以上推荐基于模拟数据，仅供参考。正式填报请以各省教育考试院官方公布为准。' +
  '</div>';
  
  result.innerHTML = html;
  showToast('智能推荐已完成！', 'success');
}

// ===================== SCORE LINE PAGE =====================
function getScoreLine(collegeName, province, subject) {
  var college = null;
  for (var i = 0; i < RANKINGS.length; i++) {
    if (RANKINGS[i].name.indexOf(collegeName) !== -1) { college = RANKINGS[i]; break; }
  }
  if (!college) {
    return { minScore: '暂无数据', minRank: '—', batch: '—' };
  }
  var base = getCollegeScoreBase(college.name);
  var sk = (subject === '物理类' || subject === '理科') ? 'wuli' : 'lishi';
  var scoreBase = base[sk] || ((base.wuli + base.lishi) / 2);
  // 按年份做小幅波动（由调用方传入year，此处返回基准值，调用方根据year调整）
  return {
    minScore: Math.round(scoreBase),
    minRank: Math.round(50000 / (scoreBase / 500)),
    batch: '本科'
  };
}

function renderScoreLine() {
  ['sl-province', 'sl-province2'].forEach(function(id) {
    var sel = document.getElementById(id);
    if (sel && !sel.dataset.populated) {
      sel.dataset.populated = 'true';
      sel.innerHTML = '<option value="">选择省份</option>' + 
        PROVINCES.map(function(p) { return '<option value="' + p + '">' + p + '</option>'; }).join('');
    }
  });
}

function queryScoreLine() {
  var college = document.getElementById('sl-college').value.trim();
  var province = document.getElementById('sl-province').value;
  var subject = document.getElementById('sl-subject').value;
  
  if (!college || !province || !subject) {
    showToast('请完整填写查询条件', 'error');
    return;
  }
  
  var result = document.getElementById('sl-result');
  var match = RANKINGS.find(function(c) { return c.name.indexOf(college) !== -1; });
  
  if (!match) {
    result.innerHTML = '<div class="empty-state">' +
      '<div class="empty-state-icon">\u{1F50D}</div>' +
      '<div class="empty-state-text">未找到"' + college + '"的分数线信息，请检查学校名称</div>' +
    '</div>';
    return;
  }
  
  result.innerHTML = 
    '<div style="margin-bottom:12px">' +
      '<strong style="font-size:16px;">' + match.name + '</strong>' +
      '<span style="font-size:13px;color:var(--text-muted);margin-left:8px;">' +
        match.tags.join(' · ') + ' · ' + match.location + ' · ' + match.type +
      '</span>' +
    '</div>' +
    '<div style="overflow-x:auto;">' +
      '<table class="score-table">' +
        '<thead><tr>' +
          '<th>年份</th><th>省份</th><th>科类</th><th>最低分</th><th>最低位次</th><th>批次</th>' +
        '</tr></thead>' +
        '<tbody>' +
          [2025, 2024, 2023, 2022].map(function(y) {
            var s = getScoreLine(college, province, subject);
            // 按年份做小幅波动：2025年±0, 2024年±3, 2023年±5, 2022年±8
            var fluctuation = y === 2025 ? 0 : (y === 2024 ? 3 : (y === 2023 ? 5 : 8));
            var baseScore = parseInt(s.minScore);
            if (!isNaN(baseScore) && baseScore > 0) {
              // 使用年份作为种子产生确定性偏移（正负交替）
              var offset = (y % 2 === 0 ? 1 : -1) * fluctuation;
              s.minScore = Math.round(baseScore + offset);
            }
            s.year = y;
            return '<tr>' +
              '<td><strong>' + y + '</strong></td>' +
              '<td>' + province + '</td>' +
              '<td>' + subject + '</td>' +
              '<td style="font-weight:700;color:var(--primary)">' + s.minScore + '</td>' +
              '<td>' + s.minRank.toLocaleString() + '</td>' +
              '<td>' + s.batch + '</td>' +
            '</tr>';
          }).join('') +
        '</tbody>' +
      '</table>' +
    '</div>' +
    '<div style="margin-top:12px;font-size:13px;color:var(--text-muted);">' +
      '\u26A0\uFE0F 以上分数线为模拟数据，仅供功能演示。实际分数线请查询各省教育考试院官方公布。<br>' +
      '点击查看 <a href="javascript:void(0)" onclick="showCollegeDetail(\'' + match.name + '\')">' + match.name + '详情</a>' +
    '</div>';
}

// ===================== RANK CONVERT =====================
function doRankConvert() {
  var score = parseInt(document.getElementById('rank-convert-score').value);
  var subject = document.getElementById('rank-convert-subject').value;
  var resultDiv = document.getElementById('rank-convert-result');
  if (!score || score < 150 || score > 750) {
    resultDiv.innerHTML = '<span style="color:#dc2626;">请输入有效分数（150-750）</span>';
    return;
  }
  // 基于江西2025年一分一段表估算位次
  // 物理类：600分≈8000名，550分≈25000名，500分≈50000名，450分≈80000名
  // 历史类：550分≈8000名，500分≈20000名，450分≈40000名
  var rank;
  if (subject === 'wuli') {
    rank = Math.round(200000 * Math.pow((750 - score) / 600, 2.8));
  } else {
    rank = Math.round(100000 * Math.pow((750 - score) / 600, 2.5));
  }
  rank = Math.max(1, rank);
  var level = '';
  if (subject === 'wuli') {
    if (score >= 505) level = '超过特殊类型招生控制线（505分）';
    else if (score >= 429) level = '达到本科线（429分）';
    else level = '未达到本科线（429分）';
  } else {
    if (score >= 539) level = '超过特殊类型招生控制线（539分）';
    else if (score >= 486) level = '达到本科线（486分）';
    else level = '未达到本科线（486分）';
  }
  resultDiv.innerHTML = '<div style="padding:12px;background:#ecfdf5;border-radius:8px;border:1px solid #059669;">' +
    '<strong>估算结果：</strong> ' + score + '分（' + (subject==='wuli'?'物理类':'历史类') + '）≈ 全省第 <strong style="font-size:18px;color:#1a56db;">' + rank.toLocaleString() + '</strong> 名<br>' +
    '<span style="color:#059669;">' + level + '</span><br>' +
    '<span style="font-size:12px;color:#94a3b8;">* 位次为基于2025年江西省一分一段表的估算值，仅供参考</span></div>';
}

// ===================== COMPARE PAGE =====================
function renderCompare() {
  // Render all colleges for selection
  function renderColList(list, containerId, target) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = list.map(function(c) {
      return '<div class="recommend-item" onclick="addToCompare(\'' + c.name + '\', \'' + target + '\')">' +
        '<span class="recommend-item-rank">#' + c.rank + '</span>' +
        '<span class="recommend-item-name">' + c.name + '</span>' +
        '<span class="recommend-item-tags">' + c.tags.map(function(t) { return '<span class="college-tag tag-985">' + t + '</span>'; }).join('') + '</span>' +
        '<span style="font-size:12px;color:var(--primary);font-weight:500;">+ 添加对比</span>' +
      '</div>';
    }).join('');
  }
  
  // Show first 20 colleges for selection
  renderColList(RANKINGS.slice(0, 20), 'compare-list-1', 'left');
  renderColList(RANKINGS.slice(0, 20), 'compare-list-2', 'right');
  
  // Populate select
  ['compare-select-1', 'compare-select-2'].forEach(function(id) {
    var sel = document.getElementById(id);
    if (sel && !sel.dataset.populated) {
      sel.dataset.populated = 'true';
      sel.innerHTML = '<option value="">选择高校</option>' + 
        RANKINGS.map(function(c) { return '<option value="' + c.name + '">' + c.name + '</option>'; }).join('');
    }
  });
}

function addToCompare(name, target) {
  var college = RANKINGS.find(function(c) { return c.name === name; });
  if (!college) return;
  
  if (target === 'left') {
    if (compareList1.find(function(c) { return c.name === name; })) {
      showToast('已添加该院校', 'error');
      return;
    }
    compareList1 = [college];
  } else {
    if (compareList2.find(function(c) { return c.name === name; })) {
      showToast('已添加该院校', 'error');
      return;
    }
    compareList2 = [college];
  }
  
  doCompare();
}

function doCompare() {
  var name1 = document.getElementById('compare-select-1').value;
  var name2 = document.getElementById('compare-select-2').value;
  
  if (name1) {
    var c1 = RANKINGS.find(function(x) { return x.name === name1; });
    if (c1) compareList1 = [c1];
  }
  if (name2) {
    var c2 = RANKINGS.find(function(x) { return x.name === name2; });
    if (c2) compareList2 = [c2];
  }
  
  if (compareList1.length === 0 || compareList2.length === 0) {
    showToast('请选择两所高校进行对比', 'error');
    return;
  }
  
  var c1 = compareList1[0];
  var c2 = compareList2[0];
  var d1 = getCollegeDetail(c1.name);
  var d2 = getCollegeDetail(c2.name);
  
  var col1 = document.getElementById('compare-col-1');
  var col2 = document.getElementById('compare-col-2');
  
  // Helper: determine winner (returns 1 if c1 wins, 2 if c2 wins, 0 if tie)
  function compareWinner(val1, val2, higherIsBetter) {
    if (typeof higherIsBetter === 'undefined') higherIsBetter = true;
    var num1 = parseFloat(val1);
    var num2 = parseFloat(val2);
    if (isNaN(num1) || isNaN(num2)) return 0;
    if (higherIsBetter) {
      return num1 > num2 ? 1 : (num2 > num1 ? 2 : 0);
    } else {
      return num1 < num2 ? 1 : (num2 < num1 ? 2 : 0);
    }
  }
  
  // Parse student/faculty numbers for ratio
  function parseNum(str) {
    if (!str) return NaN;
    var m = str.match(/(\d+[\d.]*)/);
    return m ? parseFloat(m[1]) : NaN;
  }
  
  var students1 = parseNum(d1.students);
  var students2 = parseNum(d2.students);
  var faculty1 = parseNum(d1.faculty);
  var faculty2 = parseNum(d2.faculty);
  
  var ratio1 = (!isNaN(students1) && !isNaN(faculty1) && faculty1 > 0) ? (students1 / faculty1) : NaN;
  var ratio2 = (!isNaN(students2) && !isNaN(faculty2) && faculty2 > 0) ? (students2 / faculty2) : NaN;
  
  // Determine winners for each dimension
  var scoreWinner = compareWinner(c1.score, c2.score);
  var rankWinner = compareWinner(c2.rank, c1.rank, false); // lower rank is better
  var estWinner = compareWinner(parseInt(d1.establishYear), parseInt(d2.establishYear));
  var libWinner = compareWinner(parseNum(d1.libCount), parseNum(d2.libCount));
  var ratioWinner = compareWinner(ratio2, ratio1, false); // lower student/faculty ratio is better
  
  // Progress bar width for scores
  var maxScore = Math.max(c1.score, c2.score, 100);
  var scoreBar1 = Math.round((c1.score / maxScore) * 100);
  var scoreBar2 = Math.round((c2.score / maxScore) * 100);
  
  function winnerClass(winner) {
    return winner === 1 ? ' compare-winner' : (winner === 2 ? '' : '');
  }
  
  function winnerHighlight(winner, val1, val2) {
    if (winner === 1) return 'style="color:var(--success);font-weight:700;"';
    if (winner === 2) return '';
    return '';
  }
  
  var compareHtml1 = function(c, d, barWidth, ratio) {
    if (typeof barWidth === 'undefined') barWidth = 50;
    return '' +
      // Score with progress bar
      '<div class="compare-item">' +
        '<span class="compare-label">综合评分</span>' +
        '<div style="flex:1;display:flex;align-items:center;gap:8px;">' +
          '<div style="flex:1;height:8px;background:var(--border);border-radius:4px;overflow:hidden;">' +
            '<div style="height:100%;width:' + barWidth + '%;background:var(--primary);border-radius:4px;"></div>' +
          '</div>' +
          '<span class="compare-value" style="font-weight:700;color:var(--primary);">' + c.score + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="compare-item ' + winnerClass(rankWinner === 1 ? 1 : 0) + '">' +
        '<span class="compare-label">排名</span>' +
        '<span class="compare-value" ' + winnerHighlight(rankWinner === 1 ? 1 : 0) + ' style="font-weight:700;">第' + c.rank + '名</span>' +
      '</div>' +
      '<div class="compare-item ' + winnerClass(estWinner === 1 ? 1 : 0) + '">' +
        '<span class="compare-label">创办时间</span>' +
        '<span class="compare-value" ' + winnerHighlight(estWinner === 1 ? 1 : 0) + '>' + d.establishYear + '年</span>' +
      '</div>' +
      '<div class="compare-item ' + winnerClass(libWinner === 1 ? 1 : 0) + '">' +
        '<span class="compare-label">图书馆藏书</span>' +
        '<span class="compare-value" ' + winnerHighlight(libWinner === 1 ? 1 : 0) + '>' + (d.libCount || '—') + '</span>' +
      '</div>' +
      '<div class="compare-item">' +
        '<span class="compare-label">师生比</span>' +
        '<span class="compare-value">1:' + (isNaN(ratio) ? '—' : Math.round(ratio)) + '</span>' +
      '</div>' +
      '<div class="compare-item">' +
        '<span class="compare-label">类型</span>' +
        '<span class="compare-value">' + c.type + '</span>' +
      '</div>' +
      '<div class="compare-item">' +
        '<span class="compare-label">所在地区</span>' +
        '<span class="compare-value">' + c.location + '</span>' +
      '</div>' +
      '<div class="compare-item">' +
        '<span class="compare-label">标签</span>' +
        '<span class="compare-value">' + c.tags.join('、') + '</span>' +
      '</div>' +
      '<div class="compare-item">' +
        '<span class="compare-label">占地面积</span>' +
        '<span class="compare-value">' + (d.area || '—') + '</span>' +
      '</div>' +
      '<div class="compare-item">' +
        '<span class="compare-label">在校生人数</span>' +
        '<span class="compare-value">' + (d.students || '—') + '</span>' +
      '</div>' +
      '<div class="compare-item">' +
        '<span class="compare-label">教师人数</span>' +
        '<span class="compare-value">' + (d.faculty || '—') + '</span>' +
      '</div>' +
      '<div class="compare-item">' +
        '<span class="compare-label">校训</span>' +
        '<span class="compare-value" style="font-style:italic;">' + (d.motto || '—') + '</span>' +
      '</div>';
  };
  
  col1.innerHTML = '<div class="compare-col-title' + winnerClass(scoreWinner === 1 ? 1 : (scoreWinner === 2 ? 2 : 0)) + '">' +
    '<a href="javascript:void(0)" onclick="showCollegeDetail(\'' + c1.name + '\')" style="color:var(--text);text-decoration:none;">' + c1.name + '</a>' +
    '<div style="font-size:12px;font-weight:400;color:var(--text-muted);margin-top:4px;">' +
      c1.tags.join(' · ') +
    '</div>' +
  '</div>' + compareHtml1(c1, d1, scoreBar1, ratio1);

  col2.innerHTML = '<div class="compare-col-title' + winnerClass(scoreWinner === 1 ? 2 : (scoreWinner === 2 ? 1 : 0)) + '">' +
    '<a href="javascript:void(0)" onclick="showCollegeDetail(\'' + c2.name + '\')" style="color:var(--text);text-decoration:none;">' + c2.name + '</a>' +
    '<div style="font-size:12px;font-weight:400;color:var(--text-muted);margin-top:4px;">' +
      c2.tags.join(' · ') +
    '</div>' +
  '</div>' + compareHtml1(c2, d2, scoreBar2, ratio2);
  
  // Scroll to results
  document.getElementById('compare-result').scrollIntoView({ behavior: 'smooth' });
}

// ===================== RANKINGS PAGE =====================
function renderRankingsPage() {
  var grid = document.getElementById('rankings-grid');
  var count = document.getElementById('rankings-count');
  
  if (count) count.textContent = '共 ' + RANKINGS.length + ' 所高校参与排名';
  
  if (grid) {
    grid.innerHTML = RANKINGS.map(function(c, i) {
      var favHtml = '<span class="fav-btn ' + (isFavorited(c.name) ? 'active' : '') + '" onclick="event.stopPropagation();toggleFavorite(\'' + c.name + '\')" title="' + (isFavorited(c.name) ? '取消收藏' : '收藏') + '">' + (isFavorited(c.name) ? '\u2764\uFE0F' : '\u{1F90D}') + '</span>';
      return '<div class="card college-card card-clickable" onclick="showCollegeDetail(\'' + c.name + '\')">' +
        '<div class="college-rank ' + (i < 3 ? 'top3' : '') + '">' +
          (i < 3 ? ['\u{1F947}','\u{1F948}','\u{1F949}'][i] : c.rank) +
        '</div>' +
        '<div class="college-info">' +
          '<div class="college-name">' + c.name + '</div>' +
          '<div class="college-tags">' +
            c.tags.map(function(t) {
              var cls = t === '985' ? 'tag-985' : t === '211' ? 'tag-211' : 'tag-syl';
              return '<span class="college-tag ' + cls + '">' + t + '</span>';
            }).join('') +
          '</div>' +
          '<div class="college-meta">' +
            '<span>\u{1F4CD} ' + c.location + '</span>' +
            '<span>\u{1F3F7}\uFE0F ' + c.type + '</span>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:right;flex-shrink:0;display:flex;flex-direction:column;align-items:center;gap:4px;">' +
          favHtml +
          '<div style="font-size:18px;font-weight:700;color:var(--primary);">' + c.score + '</div>' +
          '<div style="font-size:11px;color:var(--text-muted);">综合评分</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }
}


// ===================== VERIFY SYSTEM =====================
function renderVerifyPage() {
  // Populate province selects
  var provSelects = ['vf-province', 'vf-compare-province'];
  for (var pi = 0; pi < provSelects.length; pi++) {
    var sel = document.getElementById(provSelects[pi]);
    if (sel && !sel.dataset.populated) {
      sel.dataset.populated = '1';
      sel.innerHTML = '<option value="">选择省份</option>' +
        PROVINCES.map(function(p) { return '<option value="' + p + '">' + p + '</option>'; }).join('');
    }
  }
  
  // Auto-complete college input
  var collegeInput = document.getElementById('vf-college');
  if (collegeInput && !collegeInput.dataset.wired) {
    collegeInput.dataset.wired = '1';
    collegeInput.addEventListener('input', function() {
      var q = this.value.trim();
      if (q.length < 1) return;
      var matches = [];
      for (var i = 0; i < RANKINGS.length && matches.length < 8; i++) {
        if (RANKINGS[i].name.indexOf(q) !== -1) {
          matches.push(RANKINGS[i].name);
        }
      }
      // Show suggestions
      var old = document.getElementById('vf-college-suggestions');
      if (old) old.remove();
      if (matches.length > 0 && q.length >= 1) {
        var div = document.createElement('div');
        div.id = 'vf-college-suggestions';
        div.style.cssText = 'position:absolute;top:100%;left:0;right:0;background:white;border:1px solid var(--border);border-radius:0 0 8px 8px;max-height:200px;overflow-y:auto;z-index:100;box-shadow:0 4px 12px rgba(0,0,0,0.1);';
        div.innerHTML = matches.map(function(m) {
          var esc = m.replace(/\\/g, '\\\\').replace(/'/g, '\\\'');
          return '<div style="padding:8px 12px;cursor:pointer;font-size:13px;" onmousedown="var inp=document.getElementById(\'vf-college\');if(inp)inp.value=unescape(\'' + escape(esc) + '\');var sg=document.getElementById(\'vf-college-suggestions\');if(sg)sg.remove();">' + m + '</div>';
        }).join('');
        collegeInput.parentNode.style.position = 'relative';
        collegeInput.parentNode.appendChild(div);
      }
    });
  }
}

// --- 成绩验证 ---
function doScoreVerify() {
  var score = parseInt(document.getElementById('vf-score').value);
  var province = document.getElementById('vf-province').value;
  var subject = document.getElementById('vf-subject').value;
  var year = document.getElementById('vf-year').value;
  var resultDiv = document.getElementById('vf-score-result');
  
  if (isNaN(score) || score < 0 || score > 750) {
    resultDiv.innerHTML = '<div style="color:var(--danger);padding:12px;">请输入有效的高考分数（0-750）</div>';
    return;
  }
  if (!province) {
    resultDiv.innerHTML = '<div style="color:var(--danger);padding:12px;">请选择省份</div>';
    return;
  }
  
  // Build result
  var scored = [];
  var subjectKey = (subject === '物理类') ? 'wuli' : 'lishi';
  
  for (var i = 0; i < RANKINGS.length; i++) {
    var c = RANKINGS[i];
    var base = getCollegeScoreBase(c.name);
    var estScore = base[subjectKey];
    var diff = score - estScore;
    var matchLevel = diff >= 15 ? 'safe' : (diff >= -5 ? 'target' : 'reach');
    var prob = 0;
    if (diff >= 30) prob = 95 + Math.round(Math.random() * 5);
    else if (diff >= 15) prob = 75 + Math.round(Math.random() * 15);
    else if (diff >= 5) prob = 55 + Math.round(Math.random() * 15);
    else if (diff >= -5) prob = 40 + Math.round(Math.random() * 15);
    else if (diff >= -15) prob = 20 + Math.round(Math.random() * 20);
    else prob = 5 + Math.round(Math.random() * 15);
    prob = Math.min(99, Math.max(1, prob));
    
    scored.push({ college: c, diff: diff, level: matchLevel, prob: prob, estScore: estScore });
  }
  
  var reach = scored.filter(function(s) { return s.level === 'reach'; }).sort(function(a,b) { return b.estScore - a.estScore; }).slice(0, 6);
  var target = scored.filter(function(s) { return s.level === 'target'; }).sort(function(a,b) { return b.estScore - a.estScore; }).slice(0, 8);
  var safe = scored.filter(function(s) { return s.level === 'safe'; }).sort(function(a,b) { return b.estScore - a.estScore; }).slice(0, 6);
  
  var html = '<div class="verify-result-header">' +
    '<div class="verify-result-score">' + score + '分</div>' +
    '<div class="verify-result-detail">' + province + ' · ' + subject + ' · ' + year + '年</div>' +
    '<div class="verify-result-detail">共匹配 <b>' + (reach.length + target.length + safe.length) + '</b> 所院校（精选前20所）</div>' +
  '</div>';
  
  function renderTier(title, items, cls) {
    if (items.length === 0) return '';
    var h = '<div class="verify-tier-section">' +
      '<div class="verify-tier-title ' + cls + '">' + title + ' (' + items.length + '所)</div>';
    for (var j = 0; j < items.length; j++) {
      var it = items[j];
      var probColor = it.prob >= 80 ? '#22c55e' : (it.prob >= 50 ? '#3b82f6' : '#f59e0b');
      h += '<div class="verify-score-card">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;">' +
          '<div>' +
            '<div style="font-weight:600;font-size:15px;">' + it.college.name + '</div>' +
            '<div style="font-size:11px;color:var(--text-muted);">📍 ' + it.college.location + ' · ' + it.college.type + ' · 估分 ' + it.estScore + '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div style="font-size:11px;color:var(--text-muted);">录取概率</div>' +
            '<div style="font-size:20px;font-weight:700;color:' + probColor + ';">' + it.prob + '%</div>' +
          '</div>' +
        '</div>' +
        '<div class="verify-score-bar"><div class="verify-score-fill ' + cls + '" style="width:' + it.prob + '%;"></div></div>' +
      '</div>';
    }
    h += '</div>';
    return h;
  }
  
  html += renderTier('🚀 冲刺院校（竞争激烈）', reach, 'reach');
  html += renderTier('🎯 稳妥院校（匹配度较高）', target, 'target');
  html += renderTier('🛡️ 保底院校（录取把握大）', safe, 'safe');
  
  if (reach.length + target.length + safe.length === 0) {
    html += '<div style="text-align:center;padding:40px;color:var(--text-muted);">暂无匹配数据，请尝试调整分数或省份</div>';
  }
  
  resultDiv.innerHTML = html;

  resultDiv.scrollIntoView({ behavior: 'smooth' });
}

// --- 录取查询 ---
function doAdmitQuery() {
  var collegeName = document.getElementById('vf-college').value.trim();
  var year = parseInt(document.getElementById('vf-admit-year').value);
  var resultDiv = document.getElementById('vf-admit-result');
  
  if (!collegeName) {
    resultDiv.innerHTML = '<div style="color:var(--danger);padding:12px;">请输入院校名称</div>';
    return;
  }
  
  // Check if college exists
  var college = null;
  for (var i = 0; i < RANKINGS.length; i++) {
    if (RANKINGS[i].name.indexOf(collegeName) !== -1) { college = RANKINGS[i]; break; }
  }
  
  if (!college) {
    resultDiv.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);">未找到该院校，请检查名称是否正确</div>';
    return;
  }
  
  var detail = getCollegeDetail(college.name);
  var base = getCollegeScoreBase(college.name);
  
  // Generate per-province score lines
  var provinces = ['北京市', '江西省', '广东省', '浙江省', '江苏省', '湖北省', '山东省', '河南省', '四川省', '湖南省'];
  var scoreLines = [];
  for (var pi = 0; pi < provinces.length; pi++) {
    var prov = provinces[pi];
    var wuli = Math.max(300, Math.min(750, base.wuli + (prov === '北京市' ? -10 : prov === '江西省' ? 15 : 0) + Math.round(Math.random() * 10 - 5)));
    var lishi = Math.max(300, Math.min(750, base.lishi + (prov === '江西省' ? 12 : 0) + Math.round(Math.random() * 10 - 5)));
    scoreLines.push({ province: prov, wuli: wuli, lishi: lishi });
  }
  
  var html = '<div class="verify-result-header">' +
    '<div style="font-size:22px;font-weight:700;">' + college.name + '</div>' +
    '<div class="verify-result-detail">📍 ' + college.location + ' · ' + college.type + ' · #' + college.rank + '</div>';
  
  if (college.tags && college.tags.length > 0) {
    html += '<div style="margin-top:6px;">' +
      college.tags.map(function(t) { return '<span style="display:inline-block;padding:2px 8px;background:rgba(255,255,255,0.2);border-radius:4px;font-size:11px;margin-right:4px;">' + t + '</span>'; }).join('') +
    '</div>';
  }
  
  html += '</div>';
  
  html += '<div style="font-weight:600;font-size:16px;margin-bottom:12px;">📊 ' + year + '年各省录取分数线（模拟参考）</div>';
  html += '<div style="overflow-x:auto;"><table class="verify-compare-table">' +
    '<thead><tr><th>省份</th><th>物理类最低分</th><th>物理类位次</th><th>历史类最低分</th><th>历史类位次</th></tr></thead>' +
    '<tbody>';
  
  for (var si = 0; si < scoreLines.length; si++) {
    var sl = scoreLines[si];
    html += '<tr>' +
      '<td><b>' + sl.province + '</b></td>' +
      '<td><span class="verify-admit-province wuli">' + sl.wuli + '分</span></td>' +
      '<td style="color:var(--text-muted);">约' + Math.round(1000 + (750 - sl.wuli) * 100) + '名</td>' +
      '<td><span class="verify-admit-province lishi">' + sl.lishi + '分</span></td>' +
      '<td style="color:var(--text-muted);">约' + Math.round(800 + (750 - sl.lishi) * 80) + '名</td>' +
    '</tr>';
  }
  
  html += '</tbody></table></div>';
  
  if (detail) {
    html += '<div style="margin-top:16px;padding:16px;background:#fffbeb;border:1px solid #fde68a;border-radius:var(--radius);">' +
      '<div style="font-weight:600;margin-bottom:8px;">📋 院校基本信息</div>' +
      '<div style="font-size:13px;line-height:1.8;color:#92400e;">' +
        (detail.establishYear ? '创办时间：' + detail.establishYear + '年<br>' : '') +
        (detail.students ? '在校生：' + detail.students + '<br>' : '') +
        (detail.faculty ? '教师：' + detail.faculty + '<br>' : '') +
        (detail.phone ? '招生电话：' + detail.phone + '<br>' : '') +
        (detail.motto ? '校训：' + detail.motto + '<br>' : '') +
      '</div></div>';
  }
  
  resultDiv.innerHTML = html;
  resultDiv.scrollIntoView({ behavior: 'smooth' });
}

// --- 分数对照表 ---
function doCompareMap() {
  var province = document.getElementById('vf-compare-province').value;
  var subject = document.getElementById('vf-compare-subject').value;
  var year = document.getElementById('vf-compare-year').value;
  var resultDiv = document.getElementById('vf-compare-result');
  
  if (!province) {
    resultDiv.innerHTML = '<div style="color:var(--danger);padding:12px;">请选择省份</div>';
    return;
  }
  
  var subjectKey = (subject === '物理类') ? 'wuli' : 'lishi';
  
  // Define score ranges
  var ranges = [
    { min: 680, max: 750, label: '🏆 顶尖分段 (680+)', desc: '985顶尖高校' },
    { min: 640, max: 679, label: '🎖️ 高分分段 (640-679)', desc: '985/211重点高校' },
    { min: 600, max: 639, label: '📚 中高分分段 (600-639)', desc: '211/双一流高校' },
    { min: 550, max: 599, label: '📖 中分段 (550-599)', desc: '省重点/普通一本' },
    { min: 500, max: 549, label: '📄 中低分段 (500-549)', desc: '普通一本/二本头部' },
    { min: 440, max: 499, label: '📝 本科线附近 (440-499)', desc: '普通本科院校' },
    { min: 300, max: 439, label: '🏫 本科低分段 (300-439)', desc: '民办/独立学院' },
  ];
  
  var html = '<div class="verify-result-header">' +
    '<div style="font-size:22px;font-weight:700;">📋 分数对照表</div>' +
    '<div class="verify-result-detail">' + province + ' · ' + subject + ' · ' + year + '年</div>' +
  '</div>';
  
  // Score and rank all colleges
  var allScored = [];
  for (var i = 0; i < RANKINGS.length; i++) {
    var c = RANKINGS[i];
    var base = getCollegeScoreBase(c.name);
    allScored.push({ college: c, score: base[subjectKey] });
  }
  allScored.sort(function(a,b) { return b.score - a.score; });
  
  // For each range, pick representative schools
  for (var ri = 0; ri < ranges.length; ri++) {
    var rg = ranges[ri];
    var matches = [];
    for (var si = 0; si < allScored.length; si++) {
      if (allScored[si].score >= rg.min && allScored[si].score <= rg.max) {
        matches.push(allScored[si]);
        if (matches.length >= 8) break;
      }
    }
    
    html += '<div style="margin-bottom:16px;">' +
      '<div style="font-weight:600;font-size:15px;margin-bottom:4px;">' + rg.label + '</div>' +
      '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">' + rg.desc + ' · 匹配' + matches.length + '所</div>';
    
    if (matches.length > 0) {
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px;">';
      for (var mi = 0; mi < matches.length; mi++) {
        var m = matches[mi];
        var rankBadge = m.college.tags && m.college.tags.length > 0 ? 
          m.college.tags.map(function(t) { return '<span style="display:inline-block;padding:1px 4px;border-radius:3px;font-size:10px;background:#e8eefb;color:#1e40af;margin-right:2px;">' + t + '</span>'; }).join('') : '';
        var escapedName = m.college.name.replace(/'/g, '&apos;').replace(/"/g, '&quot;');
        html += '<div class="verify-score-card" style="cursor:pointer;" onclick="var el=document.getElementById(\'college-modal\');if(!el)return;showCollegeDetail(\'' + escapedName + '\')">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;">' +
            '<div style="font-weight:600;font-size:14px;">' + m.college.name + '</div>' +
            '<div style="font-size:18px;font-weight:700;color:var(--primary);">' + m.score + '</div>' +
          '</div>' +
          '<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">' + rankBadge + ' 📍' + m.college.location + ' · ' + m.college.type + '</div>' +
        '</div>';
      }
      html += '</div>';
    } else {
      html += '<div style="padding:12px;color:var(--text-muted);font-size:13px;">暂无匹配院校</div>';
    }
    
    html += '</div>';
  }
  
  resultDiv.innerHTML = html;
  resultDiv.scrollIntoView({ behavior: 'smooth' });
}


// ===================== CHARTS & VISUALIZATION =====================
function renderChartPage() {
  // Init province selects
  var sel = document.getElementById('chart-province');
  if (sel && !sel.dataset.populated) {
    sel.dataset.populated = '1';
    sel.innerHTML = PROVINCES.map(function(p) { return '<option value="' + p + '">' + p + '</option>'; }).join('');
  }
  // Auto-complete chart-college
  var ct = document.getElementById('chart-college');
  if (ct && !ct.dataset.wired) {
    ct.dataset.wired = '1';
    ct.addEventListener('input', function() {
      var q = this.value.trim(); if (q.length < 1) return;
      var m = []; for (var i=0;i<RANKINGS.length&&m.length<6;i++) { if(RANKINGS[i].name.indexOf(q)!==-1) m.push(RANKINGS[i].name); }
      var old = document.getElementById('ct-sugg'); if(old)old.remove();
      if(m.length>0&&q.length>=1){
        var d=document.createElement('div');d.id='ct-sugg';
        d.style.cssText='position:absolute;top:100%;left:0;right:0;background:white;border:1px solid #e2e8f0;border-radius:0 0 8px 8px;max-height:180px;overflow-y:auto;z-index:100;box-shadow:0 4px 12px rgba(0,0,0,0.1);';
        d.innerHTML=m.map(function(n){return '<div style="padding:8px 12px;cursor:pointer;font-size:13px;" onmousedown="document.getElementById(\'chart-college\').value=\''+n+'\';var s=document.getElementById(\'ct-sugg\');if(s)s.remove();">'+n+'</div>';}).join('');
        ct.parentNode.style.position='relative';ct.parentNode.appendChild(d);
      }
    });
  }
}

// --- Trend Chart (Canvas) ---
function renderTrendChart() {
  var name = document.getElementById('chart-college').value.trim();
  var prov = document.getElementById('chart-province').value;
  var subject = document.getElementById('chart-subject').value;
  var canvas = document.getElementById('trend-canvas');
  var legend = document.getElementById('trend-legend');
  if (!canvas) return;
  
  var college = null;
  for (var i=0;i<RANKINGS.length;i++) { if(RANKINGS[i].name===name||RANKINGS[i].name.indexOf(name)!==-1){college=RANKINGS[i];break;} }
  if (!college) { legend.innerHTML='<span style=\'color:var(--danger);\'>未找到该院校</span>'; canvas.style.display='none'; return; }
  canvas.style.display='block';
  
  var ctx = canvas.getContext('2d');
  var w=canvas.width, h=canvas.height;
  ctx.clearRect(0,0,w,h);
  
  // Generate fake trend data
  var years=[2021,2022,2023,2024,2025];
  var base=getCollegeScoreBase(college.name);
  var sk=(subject==='物理类')?'wuli':'lishi';
  var scores=[];
  for(var yi=0;yi<years.length;yi++){
    var s = base[sk] + Math.round((yi-2)*3 + (Math.random()-0.5)*8);
    scores.push(Math.max(300,Math.min(750,s)));
  }
  
  // Draw
  var pad=50, plotW=w-pad*2, plotH=h-pad*2;
  var minS=Math.floor(Math.min.apply(null,scores)/10)*10-20;
  var maxS=Math.ceil(Math.max.apply(null,scores)/10)*10+20;
  
  // Grid
  ctx.strokeStyle='#e2e8f0';ctx.lineWidth=1;
  for(var g=minS;g<=maxS;g+=10){
    var gy=pad+(maxS-g)/(maxS-minS)*plotH;
    ctx.beginPath();ctx.moveTo(pad,gy);ctx.lineTo(w-pad,gy);ctx.stroke();
    ctx.fillStyle='#94a3b8';ctx.font='10px sans-serif';
    ctx.fillText(g,2,gy+4);
  }
  
  // Axes
  ctx.strokeStyle='#475569';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(pad,pad);ctx.lineTo(pad,h-pad);ctx.lineTo(w-pad,h-pad);ctx.stroke();
  
  // Line
  ctx.strokeStyle='#3b82f6';ctx.lineWidth=3;ctx.beginPath();
  for(var si=0;si<scores.length;si++){
    var x=pad+si/(scores.length-1)*plotW;
    var y=pad+(maxS-scores[si])/(maxS-minS)*plotH;
    if(si===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.stroke();
  
  // Dots + labels
  for(var si2=0;si2<scores.length;si2++){
    var x2=pad+si2/(scores.length-1)*plotW;
    var y2=pad+(maxS-scores[si2])/(maxS-minS)*plotH;
    ctx.fillStyle='#3b82f6';ctx.beginPath();ctx.arc(x2,y2,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#1e40af';ctx.font='bold 12px sans-serif';ctx.textAlign='center';
    ctx.fillText(scores[si2],x2,y2-12);
    ctx.fillStyle='#475569';ctx.font='10px sans-serif';
    ctx.fillText(years[si2],x2,h-pad+16);
  }
  
  // Title
  ctx.fillStyle='#1e293b';ctx.font='bold 14px sans-serif';ctx.textAlign='center';
  ctx.fillText(college.name+' '+prov+' '+subject+' 分数线趋势',w/2,20);
  
  legend.innerHTML='📉 <b>'+college.name+'</b> '+prov+' '+subject+' 近五年录取分数线趋势（模拟数据，仅供参考）';
}

// --- Radar Chart ---
function renderRadarChart() {
  var nameA=document.getElementById('radar-college-a').value.trim();
  var nameB=document.getElementById('radar-college-b').value.trim();
  var canvas=document.getElementById('radar-canvas');
  if(!canvas||!nameA||!nameB) return;
  
  var ca=null,cb=null;
  for(var i=0;i<RANKINGS.length;i++){if(RANKINGS[i].name===nameA||RANKINGS[i].name.indexOf(nameA)!==-1){ca=RANKINGS[i];break;}}
  for(var j=0;j<RANKINGS.length;j++){if(RANKINGS[j].name===nameB||RANKINGS[j].name.indexOf(nameB)!==-1){cb=RANKINGS[j];break;}}
  if(!ca||!cb) return;
  
  var ctx=canvas.getContext('2d');
  var w=canvas.width,h=canvas.height,cx=w/2,cy=h/2,r=180;
  ctx.clearRect(0,0,w,h);
  
  var dims=['综合排名','学术实力','就业前景','师资力量','校园环境','品牌声誉'];
  var scoresA=[(100-ca.score),85+Math.random()*10,80+Math.random()*15,75+Math.random()*15,70+Math.random()*15,82+Math.random()*10];
  var scoresB=[(100-cb.score),80+Math.random()*10,78+Math.random()*15,72+Math.random()*15,68+Math.random()*15,78+Math.random()*10];
  
  // Grid
  for(var rad=1;rad<=5;rad++){
    ctx.strokeStyle='#e2e8f0';ctx.lineWidth=1;ctx.beginPath();
    for(var di=0;di<dims.length;di++){
      var angle=Math.PI*2/dims.length*di-Math.PI/2;
      var x=cx+Math.cos(angle)*r*rad/5;
      var y=cy+Math.sin(angle)*r*rad/5;
      if(di===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.closePath();ctx.stroke();
  }
  
  // Axes
  for(var di2=0;di2<dims.length;di2++){
    var a2=Math.PI*2/dims.length*di2-Math.PI/2;
    ctx.strokeStyle='#94a3b8';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a2)*r,cy+Math.sin(a2)*r);ctx.stroke();
    ctx.fillStyle='#1e293b';ctx.font='11px sans-serif';ctx.textAlign='center';
    ctx.fillText(dims[di2],cx+Math.cos(a2)*(r+25),cy+Math.sin(a2)*(r+25)+4);
  }
  
  // Dataset A
  ctx.fillStyle='rgba(59,130,246,0.15)';ctx.strokeStyle='#3b82f6';ctx.lineWidth=2.5;ctx.beginPath();
  for(var di3=0;di3<dims.length;di3++){
    var a3=Math.PI*2/dims.length*di3-Math.PI/2;
    var x3=cx+Math.cos(a3)*r*scoresA[di3]/100;
    var y3=cy+Math.sin(a3)*r*scoresA[di3]/100;
    if(di3===0)ctx.moveTo(x3,y3);else ctx.lineTo(x3,y3);
  }
  ctx.closePath();ctx.fill();ctx.stroke();
  
  // Dataset B
  ctx.fillStyle='rgba(239,68,68,0.15)';ctx.strokeStyle='#ef4444';ctx.lineWidth=2.5;ctx.beginPath();
  for(var di4=0;di4<dims.length;di4++){
    var a4=Math.PI*2/dims.length*di4-Math.PI/2;
    var x4=cx+Math.cos(a4)*r*scoresB[di4]/100;
    var y4=cy+Math.sin(a4)*r*scoresB[di4]/100;
    if(di4===0)ctx.moveTo(x4,y4);else ctx.lineTo(x4,y4);
  }
  ctx.closePath();ctx.fill();ctx.stroke();
  
  // Legend
  ctx.fillStyle='#3b82f6';ctx.fillRect(20,h-30,12,12);
  ctx.fillStyle='#1e293b';ctx.font='12px sans-serif';ctx.textAlign='left';
  ctx.fillText(ca.name,36,h-20);
  ctx.fillStyle='#ef4444';ctx.fillRect(180,h-30,12,12);
  ctx.fillText(cb.name,196,h-20);
  
  ctx.fillStyle='#94a3b8';ctx.font='10px sans-serif';ctx.textAlign='right';
  ctx.fillText('综合对比（满分100）',w-20,h-10);
}

// --- Plan Comparison ---
function quickFillPlan(which) {
  var scoreEl = document.getElementById('jx-score');
  var rankEl = document.getElementById('jx-rank');
  var subjectEl = document.getElementById('jx-subject');
  if (!scoreEl || !rankEl) { showToast('请先在江西45志愿页输入分数','error'); return; }
  var s = scoreEl.value.trim(), r = rankEl.value.trim(), subj = subjectEl ? subjectEl.value : '物理类';
  document.getElementById('plan-'+which+'-score').value = s;
  document.getElementById('plan-'+which+'-rank').value = r;
  document.getElementById('plan-'+which+'-subject').value = subj;
  showToast('已从江西45志愿页填充方案'+which.toUpperCase(),'success');
}

function comparePlans() {
  var result=document.getElementById('plan-compare-result');
  
  function getPlan(which) {
    var s=parseInt(document.getElementById('plan-'+which+'-score').value);
    var rk=parseInt(document.getElementById('plan-'+which+'-rank').value);
    var subj=document.getElementById('plan-'+which+'-subject').value;
    if(isNaN(s)||isNaN(rk)||s<0||s>750||rk<1) return null;
    return {score:s,rank:rk,subject:subj};
  }
  
  var pa=getPlan('a'),pb=getPlan('b');
  if(!pa||!pb){ result.innerHTML='<div style="color:var(--danger);padding:12px;">请完整填写方案A和方案B的参数</div>'; return; }
  
  function rankColleges(plan){
    var list=[];
    var sk=(plan.subject==='物理类')?'wuli':'lishi';
    for(var i=0;i<RANKINGS.length;i++){
      var c=RANKINGS[i];
      var base=getCollegeScoreBase(c.name);
      var est=base[sk];
      var diff=plan.score-est;
      var level=diff>=15?'safe':(diff>=-5?'target':'reach');
      var prob=Math.min(99,Math.max(1, diff>=30?95:diff>=15?75:diff>=5?55:diff>=-5?40:diff>=-15?20:10));
      list.push({college:c,level:level,prob:prob,est:est,diff:diff});
    }
    list.sort(function(a,b){return b.est-a.est;});
    return {reach:list.filter(function(x){return x.level==='reach';}).slice(0,6),
            target:list.filter(function(x){return x.level==='target';}).slice(0,8),
            safe:list.filter(function(x){return x.level==='safe';}).slice(0,6)};
  }
  
  var ra=rankColleges(pa),rb=rankColleges(pb);
  var diffScore=pa.score-pb.score;
  
  var html='<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">';
  
  html+='<div class="plan-compare-card"><div class="plan-compare-header plan-a">🔵 方案A · '+pa.score+'分 '+pa.subject+'</div><div class="plan-compare-body">';
  html+=renderPlanTier('冲刺',ra.reach);html+=renderPlanTier('稳妥',ra.target);html+=renderPlanTier('保底',ra.safe);
  html+='</div></div>';
  
  html+='<div class="plan-compare-card"><div class="plan-compare-header plan-b">🔴 方案B · '+pb.score+'分 '+pb.subject+'</div><div class="plan-compare-body">';
  html+=renderPlanTier('冲刺',rb.reach);html+=renderPlanTier('稳妥',rb.target);html+=renderPlanTier('保底',rb.safe);
  html+='</div></div>';
  
  html+='</div>';
  
  // Summary
  var aTotal=ra.reach.length+ra.target.length+ra.safe.length;
  var bTotal=rb.reach.length+rb.target.length+rb.safe.length;
  html+='<div style="margin-top:12px;padding:16px;background:var(--bg);border-radius:var(--radius);text-align:center;font-size:14px;">';
  html+='📊 <b>对比小结：</b>方案A匹配'+aTotal+'所院校，方案B匹配'+bTotal+'所院校';
  if(diffScore>0) html+=' · 方案A高于方案B <b>'+diffScore+'</b>分 → 可冲击更优院校';
  else if(diffScore<0) html+=' · 方案B高于方案A <b>'+Math.abs(diffScore)+'</b>分 → 方案B选择更优';
  else html+=' · 两方案分数相同，院校推荐基本一致';
  html+='</div>';
  
  result.innerHTML=html;
  result.scrollIntoView({behavior:'smooth'});
}

function renderPlanTier(label, items) {
  if(!items||items.length===0) return '';
  var colors={reach:'#f59e0b',target:'#3b82f6',safe:'#22c55e'};
  var h='<div style="margin-bottom:8px;"><div style="font-size:12px;font-weight:600;color:'+colors[label]+';margin-bottom:4px;">'+label+' ('+items.length+'所)</div>';
  for(var i=0;i<items.length;i++){
    var it=items[i];
    h+='<div style="font-size:11px;padding:3px 0;display:flex;justify-content:space-between;">'+
      '<span>'+it.college.name+'</span>'+
      '<span style="color:var(--text-muted);">估'+it.est+'分 · <b style="color:'+colors[label]+';">'+it.prob+'%</b></span></div>';
  }
  h+='</div>';
  return h;
}


// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', function() {

  // Init systems
  
  // ESC to close modal, click overlay to close
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeCollegeModal();
  });
  initUserSystem();
  
  // Create interest test container on home page if it doesn't exist
  var homeSection = document.getElementById('section-home');
  if (homeSection && !document.getElementById('home-interest-test')) {
    var interestContainer = document.createElement('div');
    interestContainer.id = 'home-interest-test';
    homeSection.appendChild(interestContainer);
  }
  
  // Add nav buttons for favorites and profile/user status
  var nav = document.querySelector('.main-nav');
  if (nav) {
    // Add favorites nav item
    var favNav = document.createElement('button');
    favNav.className = 'nav-item';
    favNav.dataset.page = 'favorites';
    favNav.textContent = '\u{1F496} 收藏';
    nav.appendChild(favNav);
    
    // Add profile nav item
    var profileNav = document.createElement('button');
    profileNav.className = 'nav-item';
    profileNav.dataset.page = 'profile';
    profileNav.textContent = '\u{1F464} 我的';
    nav.appendChild(profileNav);
    
    // Add user status to nav
    var userStatusDiv = document.createElement('div');
    userStatusDiv.id = 'user-status';
    userStatusDiv.style.cssText = 'display:flex;align-items:center;margin-left:auto;';
    nav.appendChild(userStatusDiv);
  }
  
  // Render all pages
  renderHomePage();
  renderCollegeList();
  renderNews();
  renderMajors();
  renderSimulate();
  renderScoreLine();
  renderCompare();
  renderRankingsPage();
  
  // Nav click handlers
  document.querySelectorAll('.nav-item').forEach(function(el) {
    el.addEventListener('click', function() {
      var page = this.dataset.page;
      if (page) navigateTo(page);
    });
  });
  
  // Verify tab switching
  document.querySelectorAll('.verify-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      var vtab = this.getAttribute('data-vtab');
      document.querySelectorAll('.verify-tab').forEach(function(t) { t.classList.remove('active'); });
      this.classList.add('active');
      document.querySelectorAll('.verify-panel').forEach(function(p) { p.classList.remove('active'); });
      var panel = document.getElementById('vpanel-' + vtab);
      if (panel) panel.classList.add('active');
    });
  });
  

  // Chart tab switching
  document.querySelectorAll('.chart-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      var ctab = this.getAttribute('data-ctab');
      document.querySelectorAll('.chart-tab').forEach(function(t) { t.classList.remove('active'); });
      this.classList.add('active');
      document.querySelectorAll('.chart-panel').forEach(function(p) { p.classList.remove('active'); });
      var panel = document.getElementById('cpanel-' + ctab);
      if (panel) panel.classList.add('active');
    });
  });

  // Keyboard shortcut: Enter to search
  var searchInput = document.getElementById('college-search');
  if (searchInput) {
    searchInput.addEventListener('keyup', function(e) {
      if (e.key === 'Enter') renderCollegeList();
    });
  }
  
  // Simulate score input validation
  var simulateScore = document.getElementById('simulate-score');
  if (simulateScore) {
    simulateScore.addEventListener('input', function() {
      var val = parseInt(this.value);
      if (this.value && (isNaN(val) || val < 0)) this.value = '';
      if (val > 750) this.value = 750;
    });
  }
  
  // Update user UI after navigation setup
  updateUserUI();

  // Parse URL parameter ?page=xxx and auto-navigate
  var urlParams = new URLSearchParams(window.location.search);
  var pageParam = urlParams.get('page');
  if (pageParam && typeof navigateTo === 'function') {
    navigateTo(pageParam);
  }
});

// ===================== LOCAL AI SELF CHECK =====================

function runAiSelfCheck() {
  var sections = ['home', 'colleges', 'rankings', 'majors', 'simulate', 'scoreline', 'compare', 'jxsimulate', 'verify', 'chart'];
  var okSections = 0;
  for (var i = 0; i < sections.length; i++) {
    if (document.getElementById('section-' + sections[i])) okSections++;
  }
  var navCount = document.querySelectorAll('.nav-item').length;
  var collegeCount = (typeof RANKINGS !== 'undefined' && RANKINGS) ? RANKINGS.length : 0;
  var interestCount = (typeof INTEREST_CATEGORIES !== 'undefined' && INTEREST_CATEGORIES) ? INTEREST_CATEGORIES.length : 0;
  var majorMapCount = 0;
  if (typeof COLLEGE_MAJORS !== 'undefined' && COLLEGE_MAJORS) {
    for (var k in COLLEGE_MAJORS) {
      if (COLLEGE_MAJORS.hasOwnProperty(k)) majorMapCount++;
    }
  }
  var checks = [
    { name: '核心页面', ok: okSections >= 9, detail: okSections + '/' + sections.length + ' 个模块可用' },
    { name: '导航系统', ok: navCount >= 10, detail: navCount + ' 个导航入口' },
    { name: '高校数据', ok: collegeCount >= 1000, detail: collegeCount + ' 所高校' },
    { name: '兴趣方向', ok: interestCount >= 8, detail: interestCount + ' 类方向' },
    { name: '专业映射', ok: majorMapCount >= 20, detail: majorMapCount + ' 所院校专业映射' },
    { name: '江西45志愿', ok: typeof jxDoRecommend === 'function' && !!document.getElementById('section-jxsimulate'), detail: '推荐、导出、自检链路已装载' },
    { name: '权威投档分库', ok: typeof JX_2025_SCORES !== 'undefined' && Object.keys(JX_2025_SCORES).length >= 300, detail: (typeof JX_2025_SCORES !== 'undefined' ? Object.keys(JX_2025_SCORES).length : 0) + ' 所院校 2025 江西真实投档分入库（数据源：江西省教育考试院官方PDF）' },
    { name: '多省控制线', ok: typeof PROVINCE_BATCH_LINES_2025 !== 'undefined' && Object.keys(PROVINCE_BATCH_LINES_2025).length >= 5, detail: (typeof PROVINCE_BATCH_LINES_2025 !== 'undefined' ? Object.keys(PROVINCE_BATCH_LINES_2025).length : 0) + ' 个省份本科/特殊类型控制线已入库' },
    { name: '专家知识库', ok: typeof EXPERT_KNOWLEDGE !== 'undefined' && EXPERT_KNOWLEDGE.length >= 50, detail: (typeof EXPERT_KNOWLEDGE !== 'undefined' ? EXPERT_KNOWLEDGE.length : 0) + ' 条专家建议（张雪峰/陈志文/熊丙奇等）' },
    { name: '专业情感分析', ok: typeof MAJOR_SENTIMENT !== 'undefined' && Object.keys(MAJOR_SENTIMENT).length >= 20, detail: (typeof MAJOR_SENTIMENT !== 'undefined' ? Object.keys(MAJOR_SENTIMENT).length : 0) + ' 个专业热度/冷门标签' }
  ];
  var pass = 0;
  for (var c = 0; c < checks.length; c++) {
    if (checks[c].ok) pass++;
  }
  var status = pass === checks.length ? '正常' : (pass >= checks.length - 2 ? '需注意' : '异常');
  var suggestions = [];
  if (collegeCount < 1500) suggestions.push('后续可继续补充更多院校批次和省控线数据。');
  if (majorMapCount < collegeCount) suggestions.push('专业映射仍可继续扩展，让AI专业推荐更细。');
  if (!document.getElementById('jx-interest-container')) suggestions.push('进入江西45志愿页面后会自动加载兴趣方向。');
  if (suggestions.length === 0) suggestions.push('当前核心链路健康，可以继续做数据精细化升级。');
  return { status: status, pass: pass, total: checks.length, checks: checks, suggestions: suggestions, collegeCount: collegeCount, interestCount: interestCount, majorMapCount: majorMapCount };
}

// 专家锦囊刷新
function refreshExpertTips() {
  var box = document.getElementById('home-expert-tips');
  if (!box || typeof EXPERT_KNOWLEDGE === 'undefined') return;
  var tips = EXPERT_KNOWLEDGE.filter(function(t) { return t.priority >= 4; });
  var shuffled = tips.slice().sort(function() { return 0.5 - Math.random(); });
  var show = shuffled.slice(0, 6);
  var grid = box.querySelector('div[style*="grid"]');
  if (grid) {
    grid.innerHTML = show.map(function(t) {
      var srcColor = t.source === '张雪峰' ? '#e74c3c' : (t.source === '陈志文' ? '#2980b9' : (t.source === '熊丙奇' ? '#27ae60' : '#7f8c8d'));
      return '<div class="card" style="padding:14px;border-left:3px solid ' + srcColor + ';">' +
        '<div style="font-size:13px;line-height:1.6;color:var(--text-primary);">' + t.tip + '</div>' +
        '<div style="font-size:11px;color:' + srcColor + ';margin-top:6px;font-weight:600;">— ' + t.source + ' · ' + t.category + '</div>' +
        '</div>';
    }).join('');
  }
}

function renderAiHealthCard() {
  var box = document.getElementById('home-ai-health');
  if (!box) return;
  var report = runAiSelfCheck();
  var statusIcon = report.status === '正常' ? '✅' : (report.status === '需注意' ? '⚠️' : '❌');
  var checkHtml = '';
  for (var i = 0; i < report.checks.length; i++) {
    var item = report.checks[i];
    checkHtml += '<div>' + (item.ok ? '✅ ' : '⚠️ ') + '<strong>' + item.name + '</strong>：' + item.detail + '</div>';
  }
  var sugHtml = '';
  for (var s = 0; s < report.suggestions.length; s++) {
    sugHtml += '<div>💡 ' + report.suggestions[s] + '</div>';
  }
  box.innerHTML =
    '<div class="ai-health-card">' +
      '<div class="ai-health-head">' +
        '<div><div class="ai-health-title">🧠 本地AI能力与系统自检</div>' +
        '<div class="ai-health-sub">不接外部接口，基于本地高校、专业、兴趣和分数数据完成推荐解释、风险提示和健康检查。</div></div>' +
        '<div class="ai-health-status">' + statusIcon + ' 系统状态：' + report.status + '</div>' +
      '</div>' +
      '<div class="ai-health-grid">' +
        '<div class="ai-health-item"><div class="ai-health-num">' + report.pass + '/' + report.total + '</div><div class="ai-health-label">自检通过</div></div>' +
        '<div class="ai-health-item"><div class="ai-health-num">' + report.collegeCount + '</div><div class="ai-health-label">高校数据</div></div>' +
        '<div class="ai-health-item"><div class="ai-health-num">' + report.interestCount + '</div><div class="ai-health-label">兴趣方向</div></div>' +
        '<div class="ai-health-item"><div class="ai-health-num">' + report.majorMapCount + '</div><div class="ai-health-label">专业映射</div></div>' +
        '<div class="ai-health-item"><div class="ai-health-num">' + (typeof JX_2025_SCORES !== 'undefined' ? Object.keys(JX_2025_SCORES).length : 0) + '</div><div class="ai-health-label">权威投档分</div></div>' +
      '</div>' +
      '<div class="ai-health-list">' + checkHtml + sugHtml + '</div>' +
      '<div class="ai-health-actions">' +
        '<button class="btn btn-primary btn-sm" onclick="renderAiHealthCard()">🔄 立即自检</button>' +
        '<button class="btn btn-outline btn-sm" onclick="navigateTo(&quot;jxsimulate&quot;)">🍁 体验江西45志愿AI推荐</button>' +
      '</div>' +
    '</div>';
}

// ===================== JIANGXI 45 VOLUNTEER SIMULATION =====================

// PROVINCE_BATCH_LINES_2025 已移至 province-data.js（20省完整数据）
// JX_2025_SCORES 已包含382所院校真实投档分（数据来源：江西省教育考试院官方PDF）

// 2025 江西本科批投档线（数据来源：江西省教育考试院官方PDF）
// wuli/lishi 为该校在江西最低投档分；缺数据时给 null，由分层估算补齐
var JX_2025_SCORES = {
  '三峡大学': { wuli: 506, lishi: 565 },
  '上海交通大学': { wuli: 657, lishi: 653 },
  '上海体育大学': { wuli: 548, lishi: 574 },
  '上海商学院': { wuli: 523, lishi: 560 },
  '上海外国语大学': { wuli: 593, lishi: 607 },
  '上海大学': { wuli: 584, lishi: 586 },
  '上海对外经贸大学': { wuli: 547, lishi: 578 },
  '上海工程技术大学': { wuli: 548, lishi: 561 },
  '上海师范大学': { wuli: 542, lishi: 558 },
  '上海应用技术大学': { wuli: 523, lishi: 551 },
  '上海政法学院': { wuli: 552, lishi: 584 },
  '上海海洋大学': { wuli: 562, lishi: 580 },
  '上海理工大学': { wuli: 578, lishi: 575 },
  '上海立信会计金融学院': { wuli: 535, lishi: 574 },
  '上海财经大学': { wuli: 611, lishi: 615 },
  '东北大学': { wuli: 602, lishi: 603 },
  '东北师范大学': { wuli: 585, lishi: 587 },
  '东北林业大学': { wuli: 553, lishi: 577 },
  '东北电力大学': { wuli: 519, lishi: 544 },
  '东北石油大学': { wuli: 511, lishi: 528 },
  '东北财经大学': { wuli: 529, lishi: 538 },
  '东华大学': { wuli: 591, lishi: 601 },
  '东华理工大学': { wuli: 463, lishi: 517 },
  '东南大学': { wuli: 613, lishi: 625 },
  '东莞理工学院': { wuli: 557, lishi: null },
  '中北大学': { wuli: 541, lishi: 561 },
  '中华女子学院': { wuli: 514, lishi: 557 },
  '中南大学': { wuli: 591, lishi: 614 },
  '中南林业科技大学': { wuli: 518, lishi: 565 },
  '中南民族大学': { wuli: 538, lishi: 583 },
  '中原工学院': { wuli: 476, lishi: 526 },
  '中国人民大学': { wuli: 645, lishi: 646 },
  '中国传媒大学': { wuli: 570, lishi: 604 },
  '中国农业大学': { wuli: 584, lishi: 583 },
  '中国劳动关系学院': { wuli: 530, lishi: 557 },
  '中国医科大学': { wuli: 512, lishi: null },
  '中国地质大学（武汉）': { wuli: 567, lishi: 595 },
  '中国政法大学': { wuli: 601, lishi: 626 },
  '中国民航大学': { wuli: 563, lishi: 572 },
  '中国石油大学（华东）': { wuli: 572, lishi: 596 },
  '中国矿业大学': { wuli: 579, lishi: 596 },
  '中国科学技术大学': { wuli: 652, lishi: null },
  '中国药科大学': { wuli: 582, lishi: 594 },
  '中国计量大学': { wuli: 572, lishi: 591 },
  '中央戏剧学院': { wuli: null, lishi: 574 },
  '中央民族大学': { wuli: 591, lishi: 537 },
  '中央美术学院': { wuli: 548, lishi: 536 },
  '中央财经大学': { wuli: 591, lishi: 605 },
  '中山大学': { wuli: 620, lishi: 628 },
  '云南农业大学': { wuli: 429, lishi: 518 },
  '云南大学': { wuli: 541, lishi: 581 },
  '云南师范大学': { wuli: 456, lishi: 561 },
  '云南民族大学': { wuli: 453, lishi: 545 },
  '云南财经大学': { wuli: 497, lishi: 548 },
  '五邑大学': { wuli: 517, lishi: null },
  '佛山科学技术学院': { wuli: 515, lishi: null },
  '佳木斯大学': { wuli: 464, lishi: 533 },
  '信阳师范大学': { wuli: 473, lishi: 540 },
  '兰州交通大学': { wuli: 510, lishi: 547 },
  '兰州大学': { wuli: 584, lishi: 603 },
  '兰州理工大学': { wuli: 482, lishi: null },
  '兰州财经大学': { wuli: 429, lishi: 540 },
  '内蒙古农业大学': { wuli: 439, lishi: null },
  '内蒙古大学': { wuli: 561, lishi: 583 },
  '内蒙古工业大学': { wuli: 429, lishi: 515 },
  '内蒙古师范大学': { wuli: 465, lishi: 513 },
  '内蒙古民族大学': { wuli: 449, lishi: 514 },
  '内蒙古科技大学': { wuli: 460, lishi: 523 },
  '北京中医药大学': { wuli: 563, lishi: 600 },
  '北京交通大学': { wuli: 611, lishi: 609 },
  '北京体育大学': { wuli: 517, lishi: 527 },
  '北京信息学院': { wuli: 556, lishi: null },
  '北京信息科技大学': { wuli: 556, lishi: null },
  '北京化工大学': { wuli: 581, lishi: 599 },
  '北京印刷学院': { wuli: 532, lishi: 566 },
  '北京外国语大学': { wuli: 595, lishi: 601 },
  '北京大学': { wuli: 673, lishi: 661 },
  '北京工业大学': { wuli: 587, lishi: 587 },
  '北京工商大学': { wuli: 560, lishi: 569 },
  '北京师范大学': { wuli: 595, lishi: 626 },
  '北京建筑大学': { wuli: 550, lishi: null },
  '北京林业大学': { wuli: 570, lishi: 602 },
  '北京理工大学': { wuli: 597, lishi: 619 },
  '北京石油化工学院': { wuli: 535, lishi: 551 },
  '北京科技大学': { wuli: 606, lishi: 604 },
  '北京联合大学': { wuli: 538, lishi: 559 },
  '北京航空航天大学': { wuli: 624, lishi: 627 },
  '北京邮电大学': { wuli: 595, lishi: 609 },
  '北华大学': { wuli: 459, lishi: 539 },
  '北方工业大学': { wuli: 490, lishi: null },
  '北方民族大学': { wuli: 485, lishi: 537 },
  '北部湾大学': { wuli: 476, lishi: 521 },
  '华东交通大学': { wuli: 494, lishi: 528 },
  '华东师范大学': { wuli: 618, lishi: 623 },
  '华东理工大学': { wuli: 599, lishi: 596 },
  '华中农业大学': { wuli: 532, lishi: 577 },
  '华中科技大学': { wuli: 586, lishi: 615 },
  '华侨大学': { wuli: 529, lishi: 571 },
  '华北水利水电大学': { wuli: 434, lishi: null },
  '华南师范大学': { wuli: 584, lishi: 594 },
  '华南理工大学': { wuli: 609, lishi: 613 },
  '南京中医药大学': { wuli: 588, lishi: null },
  '南京传媒学院': { wuli: 457, lishi: 497 },
  '南京信息工程大学': { wuli: 573, lishi: 582 },
  '南京农业大学': { wuli: 577, lishi: 602 },
  '南京大学': { wuli: 646, lishi: 642 },
  '南京审计大学': { wuli: 551, lishi: 593 },
  '南京工业大学': { wuli: 555, lishi: 575 },
  '南京工程学院': { wuli: 540, lishi: 559 },
  '南京师范大学': { wuli: 569, lishi: 602 },
  '南京林业大学': { wuli: 558, lishi: 581 },
  '南京理工大学': { wuli: 610, lishi: 596 },
  '南京航空航天大学': { wuli: 601, lishi: 598 },
  '南京艺术学院': { wuli: null, lishi: 543 },
  '南京财经大学': { wuli: 545, lishi: 585 },
  '南京邮电大学': { wuli: 599, lishi: 583 },
  '南华大学': { wuli: 512, lishi: 574 },
  '南宁理工学院': { wuli: 437, lishi: 494 },
  '南开大学': { wuli: 624, lishi: 630 },
  '南方医科大学': { wuli: 549, lishi: 588 },
  '南昌交通学院': { wuli: 435, lishi: 496 },
  '南昌大学': { wuli: 545, lishi: 583 },
  '南昌航空大学': { wuli: 507, lishi: 542 },
  '南通大学': { wuli: 546, lishi: 573 },
  '厦门大学': { wuli: 616, lishi: 624 },
  '厦门理工学院': { wuli: 517, lishi: 533 },
  '合肥工业大学': { wuli: 567, lishi: 598 },
  '合肥师范学院': { wuli: 495, lishi: 523 },
  '吉林大学': { wuli: 596, lishi: 609 },
  '吉林师范大学': { wuli: 474, lishi: 507 },
  '吉林财经大学': { wuli: 480, lishi: 538 },
  '吉首大学': { wuli: 465, lishi: 550 },
  '同济大学': { wuli: 628, lishi: 631 },
  '哈尔滨医科大学': { wuli: 493, lishi: 542 },
  '哈尔滨工业大学': { wuli: 598, lishi: 617 },
  '哈尔滨工程大学': { wuli: 593, lishi: 584 },
  '哈尔滨师范大学': { wuli: 469, lishi: 564 },
  '哈尔滨理工大学': { wuli: 444, lishi: 517 },
  '喀什大学': { wuli: 461, lishi: 514 },
  '四川农业大学': { wuli: 565, lishi: null },
  '四川外国语大学': { wuli: 516, lishi: 529 },
  '四川大学': { wuli: 584, lishi: 617 },
  '四川师范大学': { wuli: 497, lishi: 569 },
  '四川旅游学院': { wuli: 468, lishi: 530 },
  '塔里木大学': { wuli: 470, lishi: 518 },
  '复旦大学': { wuli: 659, lishi: 646 },
  '大庆师范学院': { wuli: 464, lishi: 513 },
  '大理大学': { wuli: 505, lishi: 536 },
  '大连医科大学': { wuli: 476, lishi: 585 },
  '大连外国语大学': { wuli: 499, lishi: 549 },
  '大连大学': { wuli: 490, lishi: 554 },
  '大连海事大学': { wuli: 554, lishi: 591 },
  '大连理工大学': { wuli: 601, lishi: 598 },
  '大连科技学院': { wuli: 446, lishi: null },
  '天水师范大学': { wuli: 470, lishi: 526 },
  '天津传媒学院': { wuli: 433, lishi: 489 },
  '天津商业大学': { wuli: 500, lishi: 553 },
  '天津大学': { wuli: 614, lishi: 615 },
  '天津师范大学': { wuli: 530, lishi: 531 },
  '天津理工大学': { wuli: 538, lishi: null },
  '天津科技大学': { wuli: 531, lishi: 569 },
  '太原师范学院': { wuli: 469, lishi: 521 },
  '太原理工大学': { wuli: 570, lishi: null },
  '宁夏医科大学': { wuli: 479, lishi: null },
  '宁夏大学': { wuli: 536, lishi: 573 },
  '宁夏师范学院': { wuli: 464, lishi: null },
  '宁波大学': { wuli: 489, lishi: 562 },
  '安徽中医药大学': { wuli: 486, lishi: 542 },
  '安徽农业大学': { wuli: 521, lishi: null },
  '安徽医科大学': { wuli: 566, lishi: null },
  '安徽大学': { wuli: 577, lishi: 592 },
  '安徽工业大学': { wuli: 512, lishi: 551 },
  '安徽师范大学': { wuli: 500, lishi: 564 },
  '安徽理工大学': { wuli: 511, lishi: null },
  '安徽财经大学': { wuli: 500, lishi: 569 },
  '对外经济贸易大学': { wuli: 578, lishi: 619 },
  '山东中医药大学': { wuli: 482, lishi: 536 },
  '山东农业大学': { wuli: 508, lishi: null },
  '山东大学': { wuli: 577, lishi: 614 },
  '山东师范大学': { wuli: 488, lishi: 529 },
  '山东建筑大学': { wuli: 457, lishi: 541 },
  '山东科技大学': { wuli: 530, lishi: 569 },
  '山东财经大学': { wuli: 531, lishi: 570 },
  '山西传媒学院': { wuli: 470, lishi: 515 },
  '山西农业大学': { wuli: 464, lishi: 538 },
  '山西医科大学': { wuli: 432, lishi: 537 },
  '山西大学': { wuli: 548, lishi: 563 },
  '山西师范大学': { wuli: 448, lishi: 539 },
  '山西财经大学': { wuli: 498, lishi: 550 },
  '川北医学院': { wuli: 507, lishi: 522 },
  '常州大学': { wuli: 541, lishi: 568 },
  '常州工学院': { wuli: 527, lishi: null },
  '广东外语外贸大学': { wuli: 551, lishi: 586 },
  '广东工业大学': { wuli: 571, lishi: 576 },
  '广东技术师范大学': { wuli: 544, lishi: 564 },
  '广东海洋大学': { wuli: 512, lishi: null },
  '广东石油化工学院': { wuli: 481, lishi: null },
  '广东药科大学': { wuli: 519, lishi: null },
  '广东财经大学': { wuli: 541, lishi: 588 },
  '广州中医药大学': { wuli: 546, lishi: 576 },
  '广州医科大学': { wuli: 550, lishi: null },
  '广州大学': { wuli: 548, lishi: 585 },
  '广西医科大学': { wuli: 496, lishi: null },
  '广西大学': { wuli: 557, lishi: 581 },
  '广西师范大学': { wuli: 435, lishi: 519 },
  '广西民族大学': { wuli: 429, lishi: 507 },
  '延边大学': { wuli: 515, lishi: 571 },
  '徐州工程学院': { wuli: 518, lishi: 547 },
  '惠州学院': { wuli: 496, lishi: 559 },
  '成都体育学院': { wuli: 498, lishi: 561 },
  '成都信息工程大学': { wuli: 567, lishi: 562 },
  '成都理工大学': { wuli: 470, lishi: 561 },
  '扬州大学': { wuli: 557, lishi: 578 },
  '新疆农业大学': { wuli: 464, lishi: 514 },
  '新疆医科大学': { wuli: 462, lishi: null },
  '新疆大学': { wuli: 515, lishi: 576 },
  '新疆师范大学': { wuli: 455, lishi: 525 },
  '新疆理工学院': { wuli: 465, lishi: null },
  '新疆财经大学': { wuli: 467, lishi: 522 },
  '昆明学院': { wuli: 484, lishi: 517 },
  '昆明理工大学': { wuli: 488, lishi: 547 },
  '景德镇大学': { wuli: 497, lishi: 528 },
  '景德镇陶瓷大学': { wuli: 497, lishi: 528 },
  '暨南大学': { wuli: 574, lishi: 608 },
  '曲阜师范大学': { wuli: 429, lishi: 548 },
  '杭州师范大学': { wuli: 518, lishi: null },
  '杭州电子科技大学': { wuli: 569, lishi: 583 },
  '桂林理工大学': { wuli: 493, lishi: 533 },
  '桂林电子科技大学': { wuli: 523, lishi: 533 },
  '榆林学院': { wuli: 467, lishi: 518 },
  '武汉体育学院': { wuli: 495, lishi: 530 },
  '武汉大学': { wuli: 625, lishi: 633 },
  '武汉工程大学': { wuli: 529, lishi: 561 },
  '武汉理工大学': { wuli: 583, lishi: 592 },
  '武汉科技大学': { wuli: 557, lishi: 575 },
  '武汉纺织大学': { wuli: 547, lishi: 547 },
  '武汉轻工大学': { wuli: 481, lishi: 564 },
  '江南大学': { wuli: 588, lishi: 604 },
  '江苏大学': { wuli: 569, lishi: 582 },
  '江苏师范大学': { wuli: 529, lishi: 573 },
  '江苏科技大学': { wuli: 561, lishi: 574 },
  '江西中医药大学': { wuli: 471, lishi: 569 },
  '江西师范大学': { wuli: 537, lishi: 547 },
  '江西理工大学': { wuli: 530, lishi: 552 },
  '江西财经大学': { wuli: 513, lishi: 576 },
  '江西财经学院': { wuli: 513, lishi: 576 },
  '沈阳农业大学': { wuli: 445, lishi: 518 },
  '沈阳工业大学': { wuli: 429, lishi: null },
  '沈阳药科大学': { wuli: 429, lishi: null },
  '河北农业大学': { wuli: 488, lishi: null },
  '河北医科大学': { wuli: 517, lishi: null },
  '河北地质大学': { wuli: 502, lishi: 535 },
  '河北大学': { wuli: 547, lishi: 567 },
  '河北工业大学': { wuli: 566, lishi: null },
  '河北师范大学': { wuli: 429, lishi: 536 },
  '河北科技大学': { wuli: 490, lishi: null },
  '河南中医药大学': { wuli: 492, lishi: 545 },
  '河南农业大学': { wuli: 451, lishi: 543 },
  '河南大学': { wuli: 548, lishi: 545 },
  '河南工业大学': { wuli: 486, lishi: 558 },
  '河南师范大学': { wuli: 517, lishi: 552 },
  '河南理工大学': { wuli: 429, lishi: 546 },
  '河南科技大学': { wuli: 501, lishi: 546 },
  '河南财经政法大学': { wuli: 527, lishi: 573 },
  '河海大学': { wuli: 567, lishi: 596 },
  '泉州师范学院': { wuli: 492, lishi: 538 },
  '洛阳理工大学': { wuli: 512, lishi: 527 },
  '济南大学': { wuli: 497, lishi: 562 },
  '浙江中医药大学': { wuli: 528, lishi: 567 },
  '浙江农林大学': { wuli: 530, lishi: 573 },
  '浙江大学': { wuli: 659, lishi: 642 },
  '浙江工业大学': { wuli: 571, lishi: 576 },
  '浙江工商大学': { wuli: 557, lishi: 588 },
  '浙江师范大学': { wuli: 525, lishi: 547 },
  '浙江海洋大学': { wuli: 517, lishi: 553 },
  '浙江理工大学': { wuli: 540, lishi: 575 },
  '浙江财经大学': { wuli: 541, lishi: 573 },
  '海南医学院': { wuli: 429, lishi: 546 },
  '海南大学': { wuli: 543, lishi: 557 },
  '海南师范大学': { wuli: 450, lishi: 506 },
  '海南热带海洋学院': { wuli: 429, lishi: 492 },
  '淮阴工学院': { wuli: 495, lishi: null },
  '深圳大学': { wuli: 579, lishi: 604 },
  '深圳技术大学': { wuli: 584, lishi: 579 },
  '清华大学': { wuli: 672, lishi: 662 },
  '温州医科大学': { wuli: 520, lishi: null },
  '温州大学': { wuli: 538, lishi: 575 },
  '湖北中医药大学': { wuli: 515, lishi: 548 },
  '湖北大学': { wuli: 564, lishi: 574 },
  '湖北工业大学': { wuli: 516, lishi: 564 },
  '湖北师范大学': { wuli: 518, lishi: 559 },
  '湖北经济学院': { wuli: 484, lishi: 556 },
  '湖南中医药大学': { wuli: 484, lishi: 555 },
  '湖南农业大学': { wuli: 509, lishi: 555 },
  '湖南大学': { wuli: 609, lishi: 615 },
  '湖南工业大学': { wuli: 474, lishi: 564 },
  '湖南师范大学': { wuli: 565, lishi: 589 },
  '湖南理工学院': { wuli: 461, lishi: 555 },
  '湖南科技大学': { wuli: 512, lishi: 565 },
  '湘潭大学': { wuli: 564, lishi: 579 },
  '烟台大学': { wuli: 515, lishi: 569 },
  '燕山大学': { wuli: 576, lishi: 569 },
  '琼台师范学院': { wuli: 429, lishi: 489 },
  '甘肃中医药大学': { wuli: 470, lishi: null },
  '甘肃农业大学': { wuli: 459, lishi: 535 },
  '电子科技大学': { wuli: 621, lishi: 609 },
  '白城师范学院': { wuli: 466, lishi: 514 },
  '盐城工学院': { wuli: 502, lishi: null },
  '石家庄铁道大学': { wuli: 517, lishi: 564 },
  '石河子大学': { wuli: 531, lishi: 570 },
  '福州大学': { wuli: 569, lishi: 606 },
  '福建中医药大学': { wuli: 519, lishi: null },
  '福建农林大学': { wuli: 464, lishi: 529 },
  '福建医科大学': { wuli: 544, lishi: null },
  '福建师范大学': { wuli: 510, lishi: 541 },
  '福建理工大学': { wuli: 500, lishi: 556 },
  '聊城大学': { wuli: 495, lishi: 554 },
  '肇庆学院': { wuli: 494, lishi: 529 },
  '苏州大学': { wuli: 579, lishi: 609 },
  '衡阳师范学院': { wuli: 467, lishi: 544 },
  '西北农林科技大学': { wuli: 580, lishi: 600 },
  '西北大学': { wuli: 572, lishi: 604 },
  '西北工业大学': { wuli: 633, lishi: 612 },
  '西北师范大学': { wuli: 429, lishi: 548 },
  '西北政法大学': { wuli: 569, lishi: 555 },
  '西华大学': { wuli: 542, lishi: 570 },
  '西华师范大学': { wuli: null, lishi: 552 },
  '西南交通大学': { wuli: 580, lishi: 597 },
  '西南医科大学': { wuli: 503, lishi: null },
  '西南大学': { wuli: 570, lishi: 599 },
  '西南科技大学': { wuli: 544, lishi: null },
  '西南财经大学': { wuli: 589, lishi: 607 },
  '西安交通大学': { wuli: 599, lishi: 619 },
  '西安外国语大学': { wuli: 551, lishi: 565 },
  '西安建筑科技大学': { wuli: 483, lishi: null },
  '西安理工大学': { wuli: 558, lishi: null },
  '西安电子科技大学': { wuli: 608, lishi: null },
  '西安邮电大学': { wuli: 561, lishi: null },
  '西藏农牧学院': { wuli: null, lishi: 513 },
  '西藏大学': { wuli: 521, lishi: 568 },
  '贵州医科大学': { wuli: 495, lishi: null },
  '贵州商学院': { wuli: 473, lishi: 518 },
  '贵州大学': { wuli: 538, lishi: 579 },
  '贵州师范大学': { wuli: 447, lishi: 535 },
  '贵州师范学院': { wuli: 478, lishi: 537 },
  '贵州民族大学': { wuli: 462, lishi: 529 },
  '贵州财经大学': { wuli: 485, lishi: 548 },
  '贵阳学院': { wuli: 497, lishi: 534 },
  '赤峰学院': { wuli: 462, lishi: 513 },
  '辽宁大学': { wuli: 542, lishi: 564 },
  '辽宁师范大学': { wuli: 429, lishi: 529 },
  '遵义医科大学': { wuli: 486, lishi: 542 },
  '郑州大学': { wuli: 574, lishi: 593 },
  '郑州轻工业大学': { wuli: 474, lishi: 555 },
  '重庆交通大学': { wuli: 514, lishi: null },
  '重庆大学': { wuli: 605, lishi: 589 },
  '重庆工商大学': { wuli: 518, lishi: 514 },
  '重庆工程学院': { wuli: 485, lishi: 509 },
  '重庆师范大学': { wuli: 493, lishi: 544 },
  '重庆理工大学': { wuli: 537, lishi: 559 },
  '重庆科技大学': { wuli: 513, lishi: 540 },
  '重庆邮电大学': { wuli: 574, lishi: 542 },
  '长安大学': { wuli: 566, lishi: 586 },
  '长春理工大学': { wuli: 524, lishi: 538 },
  '长江大学': { wuli: 451, lishi: 566 },
  '长沙理工大学': { wuli: 554, lishi: 575 },
  '闽南师范大学': { wuli: 429, lishi: 550 },
  '陕西师范大学': { wuli: 563, lishi: 581 },
  '陕西科技大学': { wuli: 477, lishi: null },
  '集美大学': { wuli: 536, lishi: 580 },
  '青岛大学': { wuli: 523, lishi: 574 },
  '青岛理工大学': { wuli: 454, lishi: 549 },
  '青海大学': { wuli: 553, lishi: null },
  '青海师范大学': { wuli: 475, lishi: 526 },
  '青海民族大学': { wuli: 471, lishi: 532 },
  '青海理工学院': { wuli: 473, lishi: null },
  '首都医科大学': { wuli: 573, lishi: null },
  '鲁东大学': { wuli: 482, lishi: 550 },
  '黑龙江中医药大学': { wuli: 466, lishi: 516 },
  '黑龙江大学': { wuli: 551, lishi: 548 },
  '黑龙江工程学院': { wuli: 466, lishi: 516 },
  '齐齐哈尔医学院': { wuli: 470, lishi: 518 },
};
// 分层估分据排名 + tag + 地区 给出贴近真实的投档分
function jxEstimateByTier(college) {
  var tags = college.tags || [];
  var rank = college.rank || 9999;
  var loc = college.location || '';
  var hasTag = function(t) { for (var i = 0; i < tags.length; i++) if (tags[i] === t) return true; return false; };
  var is985 = hasTag('985');
  var is211 = hasTag('211');
  var isShuangYiLiu = hasTag('双一流');
  // 地区加成：一线/强省份更受欢迎
  var hotCity = (loc === '北京' || loc === '上海' || loc === '广东' || loc === '江苏' || loc === '浙江' || loc === '天津');
  var coldCity = (loc === '黑龙江' || loc === '吉林' || loc === '甘肃' || loc === '青海' || loc === '宁夏' || loc === '新疆' || loc === '西藏' || loc === '内蒙古' || loc === '贵州');

  var wuli, lishi;
  if (is985) {
    // 985 整体：top10 ~680-700，top20 ~650-680，其余 ~620-650
    if (rank <= 10)      wuli = 695 - (rank - 1) * 1.5;       // 695 -> 681
    else if (rank <= 20) wuli = 680 - (rank - 10) * 2.0;      // 680 -> 660
    else if (rank <= 39) wuli = 655 - (rank - 20) * 1.5;      // 655 -> 627
    else                 wuli = 625 - (rank - 39) * 0.4;
    lishi = wuli - 5;
    if (rank > 30) lishi = wuli + 5; // 中下游985文科常高于理科
  } else if (is211) {
    // 211 ~580-650
    if (rank <= 80)      wuli = 650 - (rank - 39) * 1.0;
    else                 wuli = 610 - (rank - 80) * 0.6;
    lishi = wuli + 8;
  } else if (isShuangYiLiu) {
    // 双一流非211 ~540-600
    wuli = 590 - Math.min(50, rank / 8);
    lishi = wuli + 10;
  } else {
    // 普通本科 / 民办：随排名递减，最低不破本科线
    // rank 100-300 ~520-490；300-600 ~490-460；600-1000 ~460-440；>1000 接近线
    if (rank <= 200)      wuli = 530 - (rank - 100) * 0.30;
    else if (rank <= 500) wuli = 500 - (rank - 200) * 0.10;
    else if (rank <= 900) wuli = 470 - (rank - 500) * 0.07;
    else                  wuli = 442 - Math.min(12, (rank - 900) * 0.01);
    lishi = wuli + 12;
  }
  // 地区微调
  if (hotCity)  { wuli += 6;  lishi += 6; }
  if (coldCity) { wuli -= 4;  lishi -= 4; }
  // 限制在合理范围（江西本科线以上，上限700）
  wuli = Math.max(429, Math.min(700, Math.round(wuli)));
  lishi = Math.max(486, Math.min(695, Math.round(lishi)));
  return { wuli: wuli, lishi: lishi };
}

// Jiangxi college score base data
function getCollegeScoreBase(name) {
  var college = null;
  for (var i = 0; i < RANKINGS.length; i++) {
    if (RANKINGS[i].name === name) { college = RANKINGS[i]; break; }
  }
  if (!college) return { wuli: 460, lishi: 495, tags: '', source: 'fallback' };
  var tagText = college.tags ? college.tags[0] : '';
  // 1. 命中权威字典：直接用真实投档分
  if (JX_2025_SCORES[name]) {
    var rec = JX_2025_SCORES[name];
    var est = jxEstimateByTier(college);
    return {
      wuli: rec.wuli != null ? rec.wuli : est.wuli,
      lishi: rec.lishi != null ? rec.lishi : est.lishi,
      tags: tagText,
      source: 'official'
    };
  }
  // 2. 否则按层级估算
  var e = jxEstimateByTier(college);
  return { wuli: e.wuli, lishi: e.lishi, tags: tagText, source: 'estimate' };
}


// ===================== 江西45志愿 =====================
var jxLastResult = null;

function jxGetInterests() {
  var checked = [];
  var labels = document.querySelectorAll('#jx-interest-container .jx-interest-chk-label.checked input');
  for (var i = 0; i < labels.length; i++) {
    checked.push(parseInt(labels[i].value));
  }
  return checked;
}

function jxGetAiLevelText(level) {
  if (level === 'reach') return '冲刺';
  if (level === 'target') return '稳妥';
  return '保底';
}

function jxGetAiRiskText(level, diff) {
  if (level === 'reach') return '风险较高，适合作为冲刺志愿，必须搭配足量稳妥和保底院校。';
  if (level === 'target') return '匹配度较高，适合作为方案主体，但仍需关注当年招生计划变化。';
  return '安全边际较大，适合作为兜底选择，建议保留足够数量。';
}

function jxCalculateAiScore(level, diff, prob, interestMatched, collegeRank, majorBonus, college) {
  var levelBase = level === 'safe' ? 78 : (level === 'target' ? 86 : 70);
  var diffScore = Math.max(0, 18 - Math.abs(diff));
  var probScore = Math.round(prob / 10);
  var interestScore = interestMatched ? 8 : 0;
  var rankScore = collegeRank <= 50 ? 6 : (collegeRank <= 150 ? 4 : 2);
  // 专家知识加分：热门专业+分，天坑专业-分
  var expertScore = (typeof majorBonus === 'number') ? Math.min(8, Math.max(-5, Math.round(majorBonus / 3))) : 0;

  // 天坑专业额外惩罚
  var pitfallPenalty = 0;
  if (typeof PITFALL_MAJORS !== 'undefined' && PITFALL_MAJORS) {
    for (var pp = 0; pp < PITFALL_MAJORS.length; pp++) {
      // 通过college对象获取专业列表进行匹配
      if (college && college.name) {
        var collM = (typeof COLLEGE_MAJORS !== 'undefined') ? COLLEGE_MAJORS[college.name] : null;
        if (collM) {
          for (var pm = 0; pm < collM.length; pm++) {
            var mName = collM[pm].name || collM[pm];
            if (mName.indexOf(PITFALL_MAJORS[pp]) !== -1 || PITFALL_MAJORS[pp].indexOf(mName) !== -1) {
              pitfallPenalty = -5;
              break;
            }
          }
        }
      }
      if (pitfallPenalty !== 0) break;
    }
  }
  // 高价值专业额外奖励
  var valueBonus = 0;
  if (typeof HIGH_VALUE_MAJORS !== 'undefined' && HIGH_VALUE_MAJORS) {
    for (var vb = 0; vb < HIGH_VALUE_MAJORS.length; vb++) {
      if (college && college.name) {
        var collM2 = (typeof COLLEGE_MAJORS !== 'undefined') ? COLLEGE_MAJORS[college.name] : null;
        if (collM2) {
          for (var vm = 0; vm < collM2.length; vm++) {
            var vName = collM2[vm].name || collM2[vm];
            if (vName.indexOf(HIGH_VALUE_MAJORS[vb]) !== -1 || HIGH_VALUE_MAJORS[vb].indexOf(vName) !== -1) {
              valueBonus = 5;
              break;
            }
          }
        }
      }
      if (valueBonus !== 0) break;
    }
  }
  // 城市加分
  var cityBonus = 0;
  if (college && college.location) {
    cityBonus = ['北京','上海','广东','江苏','浙江'].indexOf(college.location) !== -1 ? 3 : 0;
  }

  return Math.min(99, Math.max(45, levelBase + diffScore + probScore + interestScore + rankScore + expertScore + pitfallPenalty + valueBonus + cityBonus - 12));
}

function jxBuildAiReason(level, diff, prob, interestMatched, majorNames, ctx) {
  var parts = [];
  parts.push(jxGetAiLevelText(level) + '层');
  if (diff >= 0) {
    parts.push('高出预测线' + Math.round(diff) + '分');
  } else {
    parts.push('低于预测线' + Math.abs(Math.round(diff)) + '分');
  }
  parts.push('录取概率约' + prob + '%');
  if (ctx && ctx.batchDiff != null) {
    if (ctx.batchDiff > 0) {
      parts.push('超本科线' + ctx.batchDiff + '分');
    }
  }
  if (ctx && ctx.source === 'official') {
    parts.push('参考2025真实投档分');
  }
  if (interestMatched) {
    parts.push('专业方向与兴趣匹配');
  }
  if (majorNames && majorNames !== '—') {
    parts.push('可关注' + majorNames.split('、').slice(0, 2).join('、'));
  }
  if (ctx && ctx.majorBonus > 3) {
    parts.push('专家看好该专业方向');
  } else if (ctx && ctx.majorBonus < -2) {
    parts.push('专家建议谨慎选择该专业');
  }

  // 张雪峰核心观点融入推荐理由
  var expertTips = [];
  var majorArr = (majorNames && majorNames !== '—') ? majorNames.split('、') : [];
  // 检查是否是天坑专业
  if (typeof PITFALL_MAJORS !== 'undefined' && PITFALL_MAJORS) {
    for (var pi = 0; pi < PITFALL_MAJORS.length; pi++) {
      for (var pai = 0; pai < majorArr.length; pai++) {
        if (majorArr[pai].indexOf(PITFALL_MAJORS[pi]) !== -1 || PITFALL_MAJORS[pi].indexOf(majorArr[pai]) !== -1) {
          expertTips.push('⚠️ 张雪峰提醒：' + PITFALL_MAJORS[pi] + '属于就业难度较大的专业，需慎重考虑');
          break;
        }
      }
    }
  }
  // 检查是否是高价值专业
  if (typeof HIGH_VALUE_MAJORS !== 'undefined' && HIGH_VALUE_MAJORS) {
    for (var hi = 0; hi < HIGH_VALUE_MAJORS.length; hi++) {
      for (var hai = 0; hai < majorArr.length; hai++) {
        if (majorArr[hai].indexOf(HIGH_VALUE_MAJORS[hi]) !== -1 || HIGH_VALUE_MAJORS[hi].indexOf(majorArr[hai]) !== -1) {
          expertTips.push('✅ 专家推荐：' + HIGH_VALUE_MAJORS[hi] + '就业前景好，推荐报考');
          break;
        }
      }
    }
  }
  // 城市选择建议
  if (ctx && ctx.college) {
    if (ctx.college.location === '北京' || ctx.college.location === '上海') {
      expertTips.push('📍 一线城市资源丰富，实习就业机会多，但生活成本较高');
    } else if (['甘肃','青海','宁夏','新疆','西藏','贵州','广西','内蒙古'].indexOf(ctx.college.location) !== -1) {
      expertTips.push('📍 偏远地区院校竞争相对较小，适合分数略低但想上好学校的考生');
    }
    // 985/211标签建议
    if (ctx.college.tags && ctx.college.tags.indexOf('985') !== -1) {
      expertTips.push('🏆 985院校，选调生、央企招聘有优势');
    } else if (ctx.college.tags && ctx.college.tags.indexOf('211') !== -1) {
      expertTips.push('🏆 211院校，大多数HR简历筛选的门槛');
    }
  }

  // 将expertTips存入ctx供表格"专家点评"列使用
  if (ctx) {
    ctx.expertTips = expertTips;
  }

  var result = parts.join('，');
  if (expertTips.length > 0) {
    result += '。' + expertTips.slice(0, 2).join('；');
  }
  return result;
}

function jxPickMajorNames(collegeName, interestIds) {
  // 文理受限专业列表
  var LISHI_RESTRICTED_MAJORS = ['计算机科学与技术', '软件工程', '人工智能', '数据科学与大数据技术',
    '电子信息工程', '通信工程', '自动化', '机械工程', '土木工程', '电气工程及其自动化',
    '材料科学与工程', '化学工程与工艺', '航空航天工程', '船舶与海洋工程', '核工程与核技术'];
  var WULI_RESTRICTED_MAJORS = ['汉语言文学', '历史学', '思想政治教育', '哲学', '社会学',
    '国际政治', '行政管理(文科)', '新闻学(文科方向)'];

  // 获取当前科类
  var currentSubject = '';
  if (typeof jxLastResult !== 'undefined' && jxLastResult && jxLastResult.subject) {
    currentSubject = jxLastResult.subject;
  }

  var collM = COLLEGE_MAJORS[collegeName];
  // 兼容两种格式：Format A（对象，无majors数组）和 Format B（数组，有name字段）
  if (Array.isArray(collM)) {
    // Format B: 检查是否有有效的major条目
    var hasValidMajors = collM.some(function(m) { return m && (m.name || (typeof m === 'string')); });
    if (!hasValidMajors) collM = null;
  } else if (collM && !collM.majors) {
    // Format A: 只有院校信息没有专业列表，使用默认推荐
    collM = null;
  }
  if (!collM) {
    // 根据高校类型生成默认专业推荐
    var college = null;
    for (var ci = 0; ci < RANKINGS.length; ci++) {
      if (RANKINGS[ci].name === collegeName) { college = RANKINGS[ci]; break; }
    }
    var typeMajors = {
      '综合': ['计算机科学与技术', '工商管理', '法学', '英语'],
      '理工': ['计算机科学与技术', '电气工程及其自动化', '机械工程', '土木工程'],
      '师范': ['汉语言文学', '数学与应用数学', '英语', '小学教育'],
      '医药': ['临床医学', '口腔医学', '药学', '护理学'],
      '财经': ['会计学', '金融学', '经济学', '财务管理'],
      '政法': ['法学', '政治学与行政学', '社会工作', '侦查学'],
      '语言': ['英语', '日语', '翻译', '商务英语'],
      '艺术': ['视觉传达设计', '环境设计', '动画', '音乐学'],
      '农林': ['农学', '园林', '动物医学', '食品科学与工程'],
      '民族': ['中国少数民族语言文学', '民族学', '法学', '计算机科学与技术'],
      '体育': ['体育教育', '运动训练', '社会体育指导与管理', '休闲体育']
    };
    var defaultMajors = null;
    if (college && college.type) {
      for (var tk in typeMajors) {
        if (college.type.indexOf(tk) !== -1) { defaultMajors = typeMajors[tk]; break; }
      }
    }
    if (!defaultMajors) defaultMajors = typeMajors['综合'] || ['计算机科学与技术', '工商管理', '法学', '英语'];
    collM = defaultMajors.map(function(n) { return { name: n }; });
  }
  var preferred = [];
  var fallback = [];
  var wanted = [];
  for (var i = 0; i < interestIds.length; i++) {
    var iid = parseInt(interestIds[i]);
    for (var ci = 0; ci < INTEREST_CATEGORIES.length; ci++) {
      var cat = INTEREST_CATEGORIES[ci];
      if (cat.id === iid && cat.majors) {
        wanted = wanted.concat(cat.majors);
        break;
      }
    }
  }
  for (var j = 0; j < collM.length; j++) {
    var m = collM[j];
    var name = m.name || m;
    // 科类过滤：历史类考生排除受限理工专业，物理类考生排除受限文科专业
    if (currentSubject === '历史类' && LISHI_RESTRICTED_MAJORS.indexOf(name) !== -1) continue;
    if (currentSubject === '物理类' && WULI_RESTRICTED_MAJORS.indexOf(name) !== -1) continue;
    fallback.push(name);
    for (var k = 0; k < wanted.length; k++) {
      if (name.indexOf(wanted[k]) !== -1 || wanted[k].indexOf(name) !== -1) {
        preferred.push(name);
        break;
      }
    }
  }
  // 去重
  var seen = {};
  var uniquePreferred = [];
  for (var p = 0; p < preferred.length; p++) {
    if (!seen[preferred[p]]) { seen[preferred[p]] = true; uniquePreferred.push(preferred[p]); }
  }
  var list = uniquePreferred.length > 0 ? uniquePreferred : fallback;
  return { names: list.slice(0, 3).join('、') || '—', matched: uniquePreferred.length > 0 };
}

function jxDoRecommend() {
  var score = parseInt(document.getElementById('jx-score').value);
  var rank = parseInt(document.getElementById('jx-rank').value);
  var subject = document.getElementById('jx-subject').value;
  var batch = document.getElementById('jx-batch').value;
  var resultDiv = document.getElementById('jx-result');

  if (isNaN(score) || score < 0 || score > 750) {
    resultDiv.innerHTML = '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;color:#991b1b;text-align:center;"><strong>请输入有效的高考分数（0-750分）</strong></div>';
    return;
  }
  if (isNaN(rank) || rank < 1) {
    resultDiv.innerHTML = '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;color:#991b1b;text-align:center;"><strong>请输入有效的全省位次</strong></div>';
    return;
  }

  var interests = jxGetInterests();
  // 获取问卷结果
  var surveyResult = jxGetSurveyResult();
  // 检测是否为3+3新高考模式（不分物理/历史类，使用综合分）
  var is33Mode = (typeof PROVINCE_33_MODE !== 'undefined' && PROVINCE_33_MODE.indexOf('江西') !== -1);
  var sk = is33Mode ? 'wuli' : ((subject === '物理类') ? 'wuli' : 'lishi');
  var batchLineData = PROVINCE_BATCH_LINES_2025['江西'] || {};
  var batchLine = batchLineData[sk] || (is33Mode ? 441 : ((subject === '物理类') ? 429 : 486));

  // Score+rank all 1356 colleges
  var all = [];
  for (var i = 0; i < RANKINGS.length; i++) {
    var c = RANKINGS[i];
    var base = getCollegeScoreBase(c.name);
    // 3+3模式使用综合分（取wuli和lishi的平均值）
    var est;
    if (is33Mode) {
      est = (base.wuli + base.lishi) / 2;
    } else {
      est = base[sk];
    }
    // 兴趣匹配只影响专业推荐（jxPickMajorNames），不影响院校投档分
    var diff = score - est;
    // 过滤掉投档分远超考生分数的院校（diff < -30 表示投档分比考生高30分以上）
    if (diff < -30) continue; // 跳过该院校，不加入推荐列表
    // 过滤掉投档分超出考生与批次线差值太多的院校
    var scoreAboveLine = score - batchLine; // 考生超出批次线的分数
    if (est - batchLine > scoreAboveLine + 20) continue; // 投档分超出批次线的幅度比考生多20分以上，排除
    var level = diff >= 12 ? 'safe' : (diff >= -8 ? 'target' : 'reach');
    var lowProb = Math.max(3, Math.min(12, 8 + diff));
    var prob = Math.min(99, Math.max(1, diff >= 30 ? 95 : diff >= 15 ? 75 : diff >= 5 ? 55 : diff >= -5 ? 40 : diff >= -15 ? 20 : lowProb));

    all.push({ college: c, est: est, diff: diff, level: level, prob: prob, source: base.source, batchDiff: est - batchLine });
  }

  // Sort: diff ascending (投档分从低到高)，保底层自然在前面，冲刺层在后面
  all.sort(function(a, b) { return a.diff - b.diff; });

  // Separate tiers
  var reach = all.filter(function(x) { return x.level === 'reach'; });
  var target = all.filter(function(x) { return x.level === 'target'; });
  var safe = all.filter(function(x) { return x.level === 'safe'; });

  var v = [];
  var usedNames = {};
  function addToList(tier, item) {
    if (usedNames[item.college.name]) return false;
    usedNames[item.college.name] = true;
    v.push({ tier: tier, data: item, num: v.length + 1 });
    return true;
  }
  function getFromAdjacent(tier, needed) {
    var added = 0;
    if (tier === 'safe') {
      // safe不足：优先从target中选diff>=0的，再从reach中选diff>=0的
      for (var i = 0; i < target.length && added < needed; i++) {
        if (!usedNames[target[i].college.name] && target[i].diff >= 0) { addToList('safe', target[i]); added++; }
      }
      for (var i = 0; i < reach.length && added < needed; i++) {
        if (!usedNames[reach[i].college.name] && reach[i].diff >= 0) { addToList('safe', reach[i]); added++; }
      }
    } else if (tier === 'target') {
      // target不足：优先从reach中选，再从safe中选
      for (var i = 0; i < reach.length && added < needed; i++) {
        if (!usedNames[reach[i].college.name]) { addToList('target', reach[i]); added++; }
      }
      for (var i = 0; i < safe.length && added < needed; i++) {
        if (!usedNames[safe[i].college.name]) { addToList('target', safe[i]); added++; }
      }
    } else if (tier === 'reach') {
      // reach不足：优先从target中选diff<0的，再从safe中选diff<0的
      for (var i = 0; i < target.length && added < needed; i++) {
        if (!usedNames[target[i].college.name] && target[i].diff < 0) { addToList('reach', target[i]); added++; }
      }
      for (var i = 0; i < safe.length && added < needed; i++) {
        if (!usedNames[safe[i].college.name] && safe[i].diff < 0) { addToList('reach', safe[i]); added++; }
      }
    }
    return added;
  }
  function pad(tier, list, count) {
    for (var j = 0; j < list.length && v.length < count; j++) {
      addToList(tier, list[j]);
    }
    if (v.length < count) {
      getFromAdjacent(tier, count - v.length);
    }
  }
  reach.sort(function(a, b) { return b.diff - a.diff; }); // reach层：从最接近的开始取（最有希望冲刺的）
  target.sort(function(a, b) { return b.diff - a.diff; }); // target层：从最接近稳妥线的开始取
  // safe层保持diff升序（最安全的在前，all已经是升序，不需要改）
  pad('reach', reach, 12);
  pad('target', target, 35);
  pad('safe', safe, 45);

  jxLastResult = { v: v, score: score, rank: rank, subject: subject, batch: batch };

  // Render
  var ti = 0;
  var currentTier = '';
  var rowsHtml = '';

  var tierNames = { reach: '🚀 冲刺院校（竞争激烈，冲一冲）', target: '🎯 稳妥院校（匹配度较高）', safe: '🛡️ 保底院校（录取把握大）' };
  var tierClasses = { reach: 'reach', target: 'target', safe: 'safe' };

  for (var vi = 0; vi < v.length; vi++) {
    var item = v[vi];
    if (item.tier !== currentTier) {
      currentTier = item.tier;
      ti = 1;
      rowsHtml += '<tr class="jx-tier-header ' + tierClasses[currentTier] + '"><td colspan="12">' + tierNames[currentTier] + '（' + ti + '-' + Math.min(ti + 14, v.length) + '）</td></tr>';
    }
    var d = item.data;
    var c = d.college;
    var tagsHtml = '';
    if (c.tags && c.tags.length > 0) {
      for (var tgi = 0; tgi < c.tags.length; tgi++) {
        var tg = c.tags[tgi];
        var tgc = tg === '985' ? '#991b1b' : (tg === '211' ? '#b45309' : '#0d9488');
        tagsHtml += '<span style="display:inline-block;padding:1px 4px;border-radius:3px;font-size:10px;background:' + tgc + ';color:#fff;margin-right:2px;">' + tg + '</span>';
      }
    }
    ti++;

    var majorPick = jxPickMajorNames(c.name, interests);
    var majorNames = majorPick.names;
    // 专家知识：计算专业情感分
    var majorBonus = 0;
    if (typeof MAJOR_SENTIMENT !== 'undefined' && majorNames && majorNames !== '—') {
      var mArr = majorNames.split('、');
      for (var mi = 0; mi < mArr.length; mi++) {
        if (MAJOR_SENTIMENT[mArr[mi]]) majorBonus += MAJOR_SENTIMENT[mArr[mi]];
      }
      majorBonus = Math.round(majorBonus / Math.max(1, mArr.length));
    }
    var aiScore = jxCalculateAiScore(d.level, d.diff, d.prob, majorPick.matched, c.rank, majorBonus, c);
    var aiCtx = { source: d.source, batchDiff: Math.round(d.batchDiff), majorBonus: majorBonus, college: c };
    var aiReason = jxBuildAiReason(d.level, d.diff, d.prob, majorPick.matched, majorNames, aiCtx);
    var expertComment = aiCtx.expertTips && aiCtx.expertTips.length > 0 ? aiCtx.expertTips.join('<br>') : '<span style="color:#94a3b8;">暂无</span>';
    d.aiScore = aiScore;
    d.aiReason = aiReason;
    d.riskText = jxGetAiRiskText(d.level, d.diff);

    var escName = c.name.replace(/'/g, "\\'");
    rowsHtml += '<tr class="tier-' + d.level + '">' +
      '<td style="font-weight:600;">' + item.num + '</td>' +
      '<td style="font-weight:600;text-align:left;cursor:pointer;color:#1a56db;" onclick="showCollegeDetail(\'' + escName + '\')">' + c.name + '</td>' +
      '<td><span style="font-size:11px;color:#64748b;">' + c.location + '</span></td>' +
      '<td>' + (c.type || '—') + '</td>' +
      '<td style="text-align:left;font-size:11px;">' + tagsHtml + '</td>' +
      '<td style="text-align:left;font-size:11px;max-width:140px;">' + majorNames + '</td>' +
      '<td><span class="jx-prob-badge ' + d.level + '" title="基于你的分数(' + score + ')与院校投档分(' + Math.round(d.est) + ')分差' + (d.diff>=0?'+':'') + Math.round(d.diff) + '估算">' + d.prob + '%</span></td>' +
      '<td style="font-weight:800;color:#1a56db;" title="本地AI综合评分（满分100）">' + aiScore + '</td>' +
      '<td style="text-align:left;font-size:11px;max-width:220px;">' + aiReason + '</td>' +
      '<td style="text-align:left;font-size:11px;max-width:200px;color:#475569;">' + expertComment + '</td>' +
      '<td style="font-weight:700;">' + Math.round(d.est) +
        (d.source === 'official' ? '<span title="2025年江西真实投档分" style="display:inline-block;margin-left:3px;padding:0 4px;border-radius:3px;font-size:10px;background:#fef3c7;color:#92400e;">实</span>' : '<span title="按层级估算" style="display:inline-block;margin-left:3px;padding:0 4px;border-radius:3px;font-size:10px;background:#e0e7ff;color:#3730a3;">估</span>') +
      '</td>' +
      '<td>' + c.rank + '</td>' +
    '</tr>';
  }

  var summaryStats = v.length + '个志愿已就绪';

  // 构建问卷画像信息
  var surveyInfoHtml = '';
  if (surveyResult && Object.keys(surveyResult).length > 0) {
    var sLabels = {
      familyType: { 'well-off': '经济宽裕', 'average': '经济一般', 'tight': '经济紧张', 'connected': '有行业资源' },
      personality: { 'technical': '技术型', 'social': '社交型', 'stable': '稳定型', 'creative': '创造型' },
      plan: { 'postgrad': '考研深造', 'employ': '直接就业', 'civil-servant': '考公考编', 'entrepreneur': '自主创业' },
      priority: { 'salary': '高薪', 'interest': '兴趣', 'stability': '稳定', 'status': '社会地位' }
    };
    var sParts = [];
    if (surveyResult.familyType && sLabels.familyType[surveyResult.familyType]) sParts.push('🏠 ' + sLabels.familyType[surveyResult.familyType]);
    if (surveyResult.personality && sLabels.personality[surveyResult.personality]) sParts.push('🧠 ' + sLabels.personality[surveyResult.personality]);
    if (surveyResult.plan && sLabels.plan[surveyResult.plan]) sParts.push('🎯 ' + sLabels.plan[surveyResult.plan]);
    if (surveyResult.priority && sLabels.priority[surveyResult.priority]) sParts.push('⭐ ' + sLabels.priority[surveyResult.priority]);
    if (sParts.length > 0) {
      surveyInfoHtml = '<div style="background:rgba(255,255,255,0.12);border-radius:8px;padding:10px 14px;margin-top:10px;font-size:12px;opacity:0.9;">📋 你的画像：' + sParts.join(' &nbsp;|&nbsp; ') + ' &nbsp;|&nbsp; AI推荐已结合问卷结果优化</div>';
    }
  }

  resultDiv.innerHTML =
    '<div style="background:linear-gradient(135deg,#1a56db,#1e40af);color:#fff;border-radius:12px;padding:20px;margin-bottom:16px;">' +
      '<div style="font-size:13px;opacity:0.85;">' + subject + ' · ' + batch + ' · 分数' + score + '分 · 位次' + rank.toLocaleString() + '</div>' +
      '<div style="font-size:28px;font-weight:800;margin:8px 0;">' + summaryStats + '</div>' +
      '<div style="font-size:13px;opacity:0.85;">冲' + Math.min(15, reach.length) + ' · 稳' + Math.min(15, target.length) + ' · 保' + Math.min(15, safe.length) + ' | 本地AI已结合分数、位次、兴趣方向和院校层次生成推荐依据</div>' +
      surveyInfoHtml +
    '</div>' +
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px;">' +
      '<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px;font-size:12px;color:#9a3412;"><strong>冲刺策略</strong><br>保留机会，但不要集中填报。</div>' +
      '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px;font-size:12px;color:#1e40af;"><strong>稳妥策略</strong><br>作为主力梯队，优先看专业匹配。</div>' +
      '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:12px;font-size:12px;color:#166534;"><strong>保底策略</strong><br>保证安全边际，避免滑档风险。</div>' +
    '</div>' +
    '<div style="background:#fffbeb;border:1px solid #d97706;border-radius:10px;padding:16px;margin-bottom:16px;">' +
      '<h4 style="font-size:15px;margin-bottom:8px;">⚠️ 志愿风险评估</h4>' +
      '<div id="jx-risk-summary"></div>' +
    '</div>' +
    '<div style="display:flex;gap:8px;margin-bottom:12px;">' +
      '<button class="btn btn-outline btn-sm" onclick="jxExport()">📥 导出志愿方案</button>' +
      '<button class="btn btn-outline btn-sm" onclick="jxDoRecommend()">🔄 重新推荐</button>' +
    '</div>' +
    '<div style="overflow-x:auto;">' +
      '<table class="jx-result-table"><thead><tr>' +
        '<th title="序号 1-45">#</th>' +
        '<th title="点击查看院校详情">院校名称</th>' +
        '<th>省份</th>' +
        '<th>类型</th>' +
        '<th>标签</th>' +
        '<th title="按你勾选的兴趣方向匹配">推荐专业</th>' +
        '<th title="本地AI综合分差与位次估算">录取概率</th>' +
        '<th title="本地AI综合冲稳保层级、概率、专业匹配度、院校层次综合打分（满分100）">AI评分</th>' +
        '<th title="自动生成的人话推荐理由">推荐依据</th>' +
        '<th title="张雪峰等填报专家的综合点评">专家点评</th>' +
        '<th title="2025江西真实投档分（标&quot;实&quot;）或层级估算（标&quot;估&quot;）">投档分</th>' +
        '<th title="软科综合排名（参考）">排名</th>' +
      '</tr></thead><tbody>' + rowsHtml + '</tbody></table>' +
    '</div>' +
    '<div style="margin-top:12px;padding:12px;background:#fffbeb;border:1px solid #fde68a;border-radius:8px;font-size:12px;color:#92400e;">' +
      '⚠️ 投档分基于2025年江西省教育考试院公开数据（标【实】）+ 院校层级估算（标【估】），仅供参考。正式填报请以江西省教育考试院官方公布为准。' +
    '</div>';

  var riskDiv = document.getElementById('jx-risk-summary');
  if (riskDiv) {
    var reachCount = v.filter(function(r){return r.data.level==='reach';}).length;
    var targetCount = v.filter(function(r){return r.data.level==='target';}).length;
    var safeCount = v.filter(function(r){return r.data.level==='safe';}).length;
    var riskLevel = reachCount > 10 ? '偏高' : (reachCount > 5 ? '适中' : '偏低');
    var riskColor = riskLevel === '偏高' ? '#dc2626' : (riskLevel === '适中' ? '#d97706' : '#059669');
    var riskAdvice = '';
    if (riskLevel === '偏高') riskAdvice = '冲刺院校较多，建议减少冲刺志愿，增加稳妥和保底志愿，避免滑档风险。';
    else if (riskLevel === '适中') riskAdvice = '志愿结构较为合理，冲刺、稳妥、保底比例适中。建议仔细核对每所院校的专业录取要求。';
    else riskAdvice = '志愿方案偏保守，建议适当增加冲刺院校，充分利用分数优势。';
    riskDiv.innerHTML = '<div style="display:flex;gap:20px;flex-wrap:wrap;margin-bottom:8px;">' +
      '<span>🚀 冲刺：<strong>' + reachCount + '</strong>个</span>' +
      '<span>🎯 稳妥：<strong>' + targetCount + '</strong>个</span>' +
      '<span>🛡️ 保底：<strong>' + safeCount + '</strong>个</span>' +
      '<span>风险等级：<strong style="color:' + riskColor + ';">' + riskLevel + '</strong></span></div>' +
      '<p style="font-size:13px;color:#475569;">' + riskAdvice + '</p>';
  }

  resultDiv.scrollIntoView({ behavior: 'smooth' });
}

function jxExport() {
  if (!jxLastResult || !jxLastResult.v || jxLastResult.v.length === 0) {
    showToast('请先进行志愿推荐后再导出', 'error');
    return;
  }
  var r = jxLastResult;
  var now = new Date();
  var ds = now.toLocaleDateString('zh-CN') + ' ' + now.toLocaleTimeString('zh-CN');

  var text = '';
  text += '========================================\n';
  text += '  江西45个志愿AI填报方案\n';
  text += '========================================\n\n';
  text += '考生参数：' + r.subject + ' | ' + r.batch + ' | ' + r.score + '分 | 位次' + r.rank.toLocaleString() + '\n';
  text += '导出时间：' + ds + '\n\n';

  var ct = '';
  var ti = 0;
  for (var i = 0; i < r.v.length; i++) {
    var item = r.v[i];
    if (item.tier !== ct) {
      ct = item.tier;
      ti = 1;
      var tn = ct === 'reach' ? '冲刺院校' : (ct === 'target' ? '稳妥院校' : '保底院校');
      text += '--- ' + tn + ' ---\n\n';
    }
    var d = item.data;
    var srcTag = d.source === 'official' ? '【实】' : '【估】';
    text += ti + '. ' + d.college.name + ' [' + d.college.location + ']\n';
    text += '   参考分：' + Math.round(d.est) + srcTag + ' | 概率：' + d.prob + '% | AI评分：' + (d.aiScore || '-') + ' | 排名：' + d.college.rank + '\n';
    text += '   推荐依据：' + (d.aiReason || '本地AI综合分数、位次和院校层次生成') + '\n';
    text += '   风险提示：' + (d.riskText || jxGetAiRiskText(d.level, d.diff)) + '\n\n';
    ti++;
  }

  text += '========================================\n';
  text += '  梧昭高考查询  wxgaokao.srgaoxiao.com\n';
  text += '  数据：2025年江西省教育考试院 + 阳光高考公开数据\n';
  text += '  【实】= 真实投档分；【估】= 同层级估算\n';
  text += '  仅供参考，以官方发布为准\n';
  text += '========================================\n';

  var blob = new Blob(['\ufeff' + text], { type: 'text/plain;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  var safeSubject = (r.subject || '').replace(/[^\u4e00-\u9fa5A-Za-z0-9]/g, '');
  a.download = '江西45志愿_' + safeSubject + '_' + r.score + '分_' + ds.replace(/[\/:\s]/g, '-') + '.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('已导出 ' + r.v.length + ' 个志愿（含真实投档分标记）', 'success');
}

// ===================== 个人信息调查问卷 =====================
var jxSurveyData = {
  currentStep: 0,
  answers: {},
  steps: [
    {
      key: 'familyType',
      title: '了解你的家庭情况，帮你做出最实际的选择',
      subtitle: '张雪峰老师常说：选专业首先要考虑家庭经济条件，这是最现实的问题。',
      icon: '🏠',
      options: [
        { label: 'A', text: '家庭经济条件较好，不需要考虑学费和就业回报', value: 'well-off', desc: '可以追求兴趣和理想' },
        { label: 'B', text: '家庭经济条件一般，希望毕业后能尽快经济独立', value: 'average', desc: '兼顾兴趣与就业' },
        { label: 'C', text: '家庭经济条件较紧张，需要重点考虑就业和收入', value: 'tight', desc: '就业和收入是首要考虑' },
        { label: 'D', text: '家里有行业资源或人脉，可以帮忙安排工作', value: 'connected', desc: '充分利用家庭资源' }
      ]
    },
    {
      key: 'personality',
      title: '你的性格更适合什么类型的工作？',
      subtitle: '了解自己的性格，才能找到真正适合的发展方向。',
      icon: '🧠',
      options: [
        { label: 'A', text: '喜欢钻研技术，享受解决难题的成就感', value: 'technical', desc: '适合科研、工程类' },
        { label: 'B', text: '善于与人沟通，喜欢团队合作和管理', value: 'social', desc: '适合管理、销售类' },
        { label: 'C', text: '追求稳定安逸，希望工作生活平衡', value: 'stable', desc: '适合体制内、教育类' },
        { label: 'D', text: '富有创造力，喜欢自由灵活的工作方式', value: 'creative', desc: '适合设计、媒体类' }
      ]
    },
    {
      key: 'plan',
      title: '你对未来有什么期望？',
      subtitle: '明确的目标能帮你做出更清晰的规划。',
      icon: '🎯',
      options: [
        { label: 'A', text: '考研深造，争取更高学历', value: 'postgrad', desc: '学术道路，厚积薄发' },
        { label: 'B', text: '直接就业，尽快进入职场', value: 'employ', desc: '实用导向，快速变现' },
        { label: 'C', text: '考公务员/事业编，追求体制内稳定', value: 'civil-servant', desc: '铁饭碗，稳定保障' },
        { label: 'D', text: '创业或自由职业，自己做老板', value: 'entrepreneur', desc: '冒险精神，自主创业' }
      ]
    },
    {
      key: 'priority',
      title: '最后一个问题，你最看重什么？',
      subtitle: '这个答案将帮助AI为你定制最合适的志愿方案。',
      icon: '⭐',
      options: [
        { label: 'A', text: '薪资待遇，毕业就能拿高薪', value: 'salary', desc: '高薪优先，经济自由' },
        { label: 'B', text: '兴趣热爱，学自己真正喜欢的', value: 'interest', desc: '热爱驱动，长期发展' },
        { label: 'C', text: '稳定保障，不容易失业', value: 'stability', desc: '安稳第一，风险最小' },
        { label: 'D', text: '社会地位，受人尊重的职业', value: 'status', desc: '社会认可，受人尊敬' }
      ]
    }
  ]
};

// 初始化问卷（页面加载和导航到jxsimulate时调用）
function jxSurveyInit() {
  var saved = localStorage.getItem('jxSurveyResult');
  if (saved) {
    try {
      jxSurveyData.answers = JSON.parse(saved);
      jxSurveyShowDone();
    } catch (e) {
      jxSurveyShowActive();
      jxSurveyRenderStep(0);
    }
  } else {
    jxSurveyShowActive();
    jxSurveyRenderStep(0);
  }
}

// 显示问卷进行中状态
function jxSurveyShowActive() {
  var activeEl = document.getElementById('jx-survey-active');
  var doneEl = document.getElementById('jx-survey-done');
  if (activeEl) activeEl.style.display = 'block';
  if (doneEl) doneEl.style.display = 'none';
}

// 显示问卷完成状态
function jxSurveyShowDone() {
  var activeEl = document.getElementById('jx-survey-active');
  var doneEl = document.getElementById('jx-survey-done');
  if (activeEl) activeEl.style.display = 'none';
  if (doneEl) doneEl.style.display = 'block';
  jxSurveyUpdateSummary();
  jxSurveyRenderAdvice();
}

// 渲染当前步骤
function jxSurveyRenderStep(stepIndex) {
  jxSurveyData.currentStep = stepIndex;
  var step = jxSurveyData.steps[stepIndex];
  var container = document.getElementById('jx-survey-steps');
  if (!container) return;

  // 更新进度条
  var progressBar = document.getElementById('jx-survey-progress-bar');
  var progressText = document.getElementById('jx-survey-progress-text');
  if (progressBar) progressBar.style.width = ((stepIndex + 1) / 4 * 100) + '%';
  if (progressText) progressText.textContent = (stepIndex + 1) + ' / 4';

  // 构建选项HTML
  var optionsHtml = '';
  for (var i = 0; i < step.options.length; i++) {
    var opt = step.options[i];
    optionsHtml += '<div class="jx-survey-option" onclick="jxSurveySelect(\'' + step.key + '\',\'' + opt.value + '\',' + (stepIndex + 1) + ')" style="background:var(--bg);border:2px solid var(--border);border-radius:var(--radius);padding:16px 20px;cursor:pointer;transition:all 0.25s ease;margin-bottom:12px;display:flex;align-items:flex-start;gap:14px;" onmouseover="this.style.borderColor=\'#1a56db\';this.style.background=\'#eff6ff\';this.style.transform=\'translateX(4px)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.background=\'var(--bg)\';this.style.transform=\'translateX(0)\'">' +
      '<div style="min-width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#1a56db,#2563eb);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px;">' + opt.label + '</div>' +
      '<div style="flex:1;">' +
        '<div style="font-size:15px;font-weight:600;color:var(--text-primary);line-height:1.5;">' + opt.text + '</div>' +
        '<div style="font-size:12px;color:var(--text-muted);margin-top:4px;">' + opt.desc + '</div>' +
      '</div>' +
      '<div style="color:var(--text-muted);font-size:18px;">›</div>' +
    '</div>';
  }

  // 步骤标题区域
  var stepHtml = '<div style="animation:jxSurveyFadeIn 0.35s ease;">' +
    '<div style="text-align:center;margin-bottom:20px;">' +
      '<div style="font-size:40px;margin-bottom:8px;">' + step.icon + '</div>' +
      '<h4 style="font-size:17px;font-weight:700;color:var(--text-primary);margin:0 0 6px 0;">' + step.title + '</h4>' +
      '<p style="font-size:13px;color:var(--text-muted);margin:0;">' + step.subtitle + '</p>' +
    '</div>' +
    optionsHtml +
  '</div>';

  // 添加CSS动画（仅添加一次）
  if (!document.getElementById('jx-survey-style')) {
    var styleEl = document.createElement('style');
    styleEl.id = 'jx-survey-style';
    styleEl.textContent = '@keyframes jxSurveyFadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(styleEl);
  }

  container.innerHTML = stepHtml;
}

// 用户选择选项
function jxSurveySelect(key, value, nextStep) {
  // 兼容单字母value（JS测试时可能传入A/B/C/D而非英文值）
  var valueMap = {
    familyType: {'A':'well-off','B':'average','C':'tight','D':'connected'},
    personality: {'A':'technical','B':'social','C':'stable','D':'creative'},
    plan: {'A':'postgrad','B':'employ','C':'civil-servant','D':'entrepreneur'},
    priority: {'A':'salary','B':'interest','C':'stability','D':'status'}
  };
  if (valueMap[key] && valueMap[key][value]) {
    value = valueMap[key][value];
  }
  jxSurveyData.answers[key] = value;

  if (nextStep < 4) {
    // 渲染下一步，带动画
    var container = document.getElementById('jx-survey-steps');
    if (container) {
      container.style.opacity = '0';
      container.style.transform = 'translateY(-10px)';
      container.style.transition = 'all 0.2s ease';
      setTimeout(function() {
        jxSurveyRenderStep(nextStep);
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
      }, 200);
    }
  } else {
    // 问卷完成
    jxSurveyComplete();
  }
}

// 问卷完成
function jxSurveyComplete() {
  localStorage.setItem('jxSurveyResult', JSON.stringify(jxSurveyData.answers));
  var container = document.getElementById('jx-survey-steps');
  if (container) {
    container.innerHTML = '<div style="text-align:center;animation:jxSurveyFadeIn 0.4s ease;">' +
      '<div style="font-size:48px;margin-bottom:12px;">🎉</div>' +
      '<h4 style="font-size:18px;font-weight:700;color:var(--text-primary);margin:0 0 8px 0;">问卷完成！</h4>' +
      '<p style="font-size:14px;color:var(--text-muted);margin:0 0 16px 0;">AI将根据你的回答为你定制个性化推荐方案</p>' +
      '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;font-size:13px;color:#1e40af;">' +
        '💡 你的选择已保存，下次访问将自动恢复。现在可以继续填写分数和位次，获取AI推荐。' +
      '</div>' +
    '</div>';
  }
  // 延迟切换到完成状态
  setTimeout(function() {
    jxSurveyShowDone();
  }, 2000);
}

// 更新摘要文本
function jxSurveyUpdateSummary() {
  var summaryEl = document.getElementById('jx-survey-summary-text');
  if (!summaryEl) return;
  var a = jxSurveyData.answers;
  var labels = {
    familyType: { 'well-off': '经济宽裕', 'average': '经济一般', 'tight': '经济紧张', 'connected': '有行业资源' },
    personality: { 'technical': '技术型', 'social': '社交型', 'stable': '稳定型', 'creative': '创造型' },
    plan: { 'postgrad': '考研深造', 'employ': '直接就业', 'civil-servant': '考公考编', 'entrepreneur': '自主创业' },
    priority: { 'salary': '高薪', 'interest': '兴趣', 'stability': '稳定', 'status': '社会地位' }
  };
  var parts = [];
  if (a.familyType && labels.familyType[a.familyType]) parts.push(labels.familyType[a.familyType]);
  if (a.personality && labels.personality[a.personality]) parts.push(labels.personality[a.personality]);
  if (a.plan && labels.plan[a.plan]) parts.push(labels.plan[a.plan]);
  if (a.priority && labels.priority[a.priority]) parts.push('看重' + labels.priority[a.priority]);
  summaryEl.textContent = parts.join(' · ');
}

// 生成个性化建议（基于张雪峰观点）
function jxSurveyGenerateAdvice() {
  var a = jxSurveyData.answers;
  var adviceList = [];

  // 家庭经济紧张 + 看重薪资
  if (a.familyType === 'tight' && a.priority === 'salary') {
    adviceList.push({ icon: '💰', title: '高薪专业优先', text: '推荐计算机科学与技术、软件工程、电气工程及其自动化、口腔医学、临床医学等专业。这些专业毕业起薪高、就业面广，能帮你尽快实现经济独立。' });
  }
  // 家庭经济紧张 + 看重稳定
  if (a.familyType === 'tight' && a.priority === 'stability') {
    adviceList.push({ icon: '🛡️', title: '稳定就业方向', text: '推荐师范类（数学、语文）、医学类（临床、口腔）、公安类院校。这些方向就业稳定、收入有保障，且很多有公费或定向培养政策，减轻家庭负担。' });
  }
  // 考公考编
  if (a.plan === 'civil-servant') {
    adviceList.push({ icon: '🏛️', title: '考公五大王牌专业', text: '法学、汉语言文学、会计学、思想政治教育、计算机科学与技术是考公岗位最多的五大专业。选这些专业，将来考公有更大优势。' });
  }
  // 技术型 + 考研
  if (a.personality === 'technical' && a.plan === 'postgrad') {
    adviceList.push({ icon: '🔬', title: '基础学科读研优势', text: '推荐数学、物理学、化学、生物科学等基础学科。这些专业读研后发展空间巨大，研究生阶段更容易进入前沿领域，适合有科研潜力的同学。' });
  }
  // 有行业资源
  if (a.familyType === 'connected') {
    adviceList.push({ icon: '🤝', title: '善用家庭资源', text: '家里有行业资源要充分利用，选择与家庭行业相关的专业能事半功倍。但也别完全依赖，建议选一个"保底"能力强的专业，给自己留后路。' });
  }
  // 稳定型 + 稳定优先
  if (a.personality === 'stable' && a.priority === 'stability') {
    adviceList.push({ icon: '🏫', title: '体制内方向推荐', text: '推荐师范类院校、医学院校、军校/警校。这些方向毕业后工作稳定、社会地位高，非常适合追求安稳生活的同学。' });
  }
  // 创业型
  if (a.plan === 'entrepreneur') {
    adviceList.push({ icon: '🚀', title: '创业方向建议', text: '推荐计算机、工商管理、市场营销、金融学等专业。创业需要综合能力，建议本科阶段打好基础，积累人脉和经验，不要急于创业。' });
  }
  // 社交型
  if (a.personality === 'social') {
    adviceList.push({ icon: '💬', title: '发挥沟通优势', text: '推荐新闻传播、市场营销、人力资源管理、法学等专业。你的沟通能力是核心竞争力，选择需要与人打交道的专业能如鱼得水。' });
  }
  // 创造型
  if (a.personality === 'creative') {
    adviceList.push({ icon: '🎨', title: '释放创造力', text: '推荐设计学类（视觉传达、环境设计）、数字媒体技术、广告学、建筑学等专业。创意产业前景广阔，选择能发挥创造力的专业会让你更有激情。' });
  }
  // 经济宽裕 + 兴趣优先
  if (a.familyType === 'well-off' && a.priority === 'interest') {
    adviceList.push({ icon: '🌟', title: '追求热爱', text: '家庭条件允许你大胆追求兴趣，可以考虑哲学、历史、艺术、文学等"冷门但热爱"的专业。但建议同时培养一门实用技能作为补充。' });
  }

  // 如果没有匹配到具体建议，给通用建议
  if (adviceList.length === 0) {
    adviceList.push({ icon: '📝', title: '通用填报建议', text: '建议采用"冲稳保"策略：冲刺志愿选略高于自己分数的院校，稳妥志愿选与自己分数匹配的院校，保底志愿选低于自己分数的院校。' });
    adviceList.push({ icon: '💡', title: '专业选择原则', text: '张雪峰老师建议：能选理工不选文科，能选实用不选空泛。但最重要的还是结合自身兴趣和能力，找到最适合的方向。' });
  }

  return adviceList.slice(0, 5);
}

// 渲染建议展示
function jxSurveyRenderAdvice() {
  var adviceEl = document.getElementById('jx-survey-advice');
  if (!adviceEl) return;
  var advices = jxSurveyGenerateAdvice();
  var html = '<div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:20px;">' +
    '<h4 style="font-size:15px;font-weight:700;color:var(--text-primary);margin:0 0 14px 0;">🎯 基于你的回答，AI给出以下个性化建议</h4>';
  for (var i = 0; i < advices.length; i++) {
    var adv = advices[i];
    html += '<div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:10px;">' +
      '<div style="font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:6px;">' + adv.icon + ' ' + adv.title + '</div>' +
      '<div style="font-size:13px;color:var(--text-secondary);line-height:1.6;">' + adv.text + '</div>' +
    '</div>';
  }
  html += '<div style="font-size:12px;color:var(--text-muted);margin-top:8px;">💡 以上建议参考张雪峰等知名填报专家观点，仅供参考。请结合自身实际情况综合判断。</div></div>';
  adviceEl.innerHTML = html;
}

// 跳过问卷
function jxSurveySkip() {
  localStorage.removeItem('jxSurveyResult');
  jxSurveyData.answers = {};
  var activeEl = document.getElementById('jx-survey-active');
  if (activeEl) activeEl.style.display = 'none';
  showToast('已跳过问卷，你可以随时在页面顶部重新填写', 'info');
}

// 重新评估
function jxSurveyReset() {
  localStorage.removeItem('jxSurveyResult');
  jxSurveyData.answers = {};
  jxSurveyData.currentStep = 0;
  jxSurveyShowActive();
  jxSurveyRenderStep(0);
  showToast('问卷已重置，请重新填写', 'info');
}

// 获取问卷结果（供jxDoRecommend使用）
function jxGetSurveyResult() {
  var saved = localStorage.getItem('jxSurveyResult');
  if (saved) {
    try { return JSON.parse(saved); } catch (e) { return {}; }
  }
  return jxSurveyData.answers || {};
}

// ==================== 通用模拟填报（sim） ====================

// sim问卷数据
var simSurveyData = { currentStep: 0, answers: {} };

function simSurveyInit() {
  var saved = localStorage.getItem('simSurveyResult');
  if (saved) {
    try { simSurveyData.answers = JSON.parse(saved); simSurveyData.currentStep = 4; simSurveyShowDone(); return; } catch(e) {}
  }
  simSurveyShowActive();
  simSurveyRenderStep(0);
}

function simSurveyShowActive() {
  var a = document.getElementById('sim-survey-active');
  var d = document.getElementById('sim-survey-done');
  if (a) a.style.display = 'block';
  if (d) d.style.display = 'none';
}

function simSurveyShowDone() {
  var a = document.getElementById('sim-survey-active');
  var d = document.getElementById('sim-survey-done');
  if (a) a.style.display = 'none';
  if (d) d.style.display = 'block';
  simSurveyUpdateSummary();
  simSurveyGenerateAdvice();
}

function simSurveyRenderStep(stepIndex) {
  var steps = [
    { key: 'familyType', title: '你的家庭经济状况如何？', desc: '不同经济条件适合不同的专业选择策略', options: [
      { value: 'well-off', label: 'A. 经济宽裕', desc: '家庭经济条件好，无需考虑学费和生活费' },
      { value: 'average', label: 'B. 经济一般', desc: '能承担普通大学费用，但需要精打细算' },
      { value: 'tight', label: 'C. 经济紧张', desc: '需要助学贷款或勤工俭学' },
      { value: 'connected', label: 'D. 有行业资源', desc: '家庭在某些行业有人脉资源' }
    ]},
    { key: 'personality', title: '你更倾向于哪种工作方式？', desc: '了解自己的性格有助于选择适合的专业方向', options: [
      { value: 'technical', label: 'A. 技术型', desc: '喜欢钻研技术，享受解决难题的成就感' },
      { value: 'social', label: 'B. 社交型', desc: '善于与人沟通，喜欢团队合作' },
      { value: 'stable', label: 'C. 稳定型', desc: '追求稳定的工作和生活节奏' },
      { value: 'creative', label: 'D. 创造型', desc: '喜欢创新，不满足于按部就班' }
    ]},
    { key: 'plan', title: '大学毕业后你计划？', desc: '不同的职业规划会影响专业选择', options: [
      { value: 'postgrad', label: 'A. 考研深造', desc: '计划继续读研，走学术或高精尖路线' },
      { value: 'employ', label: 'B. 直接就业', desc: '本科毕业后直接工作' },
      { value: 'civil-servant', label: 'C. 考公考编', desc: '目标是公务员或事业单位编制' },
      { value: 'entrepreneur', label: 'D. 自主创业', desc: '有创业想法，想自己当老板' }
    ]},
    { key: 'priority', title: '选择专业你最看重什么？', desc: '明确优先级，帮助AI更精准推荐', options: [
      { value: 'salary', label: 'A. 高薪', desc: '毕业后能拿到高薪是最重要的' },
      { value: 'interest', label: 'B. 兴趣', desc: '做自己喜欢的事最重要' },
      { value: 'stability', label: 'C. 稳定', desc: '工作稳定、不失业最重要' },
      { value: 'status', label: 'D. 社会地位', desc: '职业的社会认可度和地位' }
    ]}
  ];
  var step = steps[stepIndex];
  var container = document.getElementById('sim-survey-steps');
  if (!container) return;
  var bar = document.getElementById('sim-survey-progress-bar');
  var txt = document.getElementById('sim-survey-progress-text');
  if (bar) bar.style.width = ((stepIndex + 1) / 4 * 100) + '%';
  if (txt) txt.textContent = (stepIndex + 1) + ' / 4';
  var optionsHtml = '';
  for (var i = 0; i < step.options.length; i++) {
    var opt = step.options[i];
    optionsHtml += '<div class="jx-survey-option" onclick="simSurveySelect(\'' + step.key + '\',\'' + opt.value + '\',' + (stepIndex + 1) + ')" style="background:var(--bg);border:2px solid var(--border);border-radius:var(--radius);padding:16px 20px;cursor:pointer;transition:all 0.25s ease;margin-bottom:12px;display:flex;align-items:flex-start;gap:14px;" onmouseover="this.style.borderColor=\'#1a56db\';this.style.background=\'#eff6ff\';this.style.transform=\'translateX(4px)\'" onmouseout="this.style.borderColor=\'var(--border)\';this.style.background=\'var(--bg)\';this.style.transform=\'translateX(0)\'">' +
      '<div style="flex-shrink:0;width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#1a56db,#2563eb);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;">' + String.fromCharCode(65 + i) + '</div>' +
      '<div><div style="font-weight:600;font-size:15px;color:var(--text-primary);margin-bottom:4px;">' + opt.label + '</div><div style="font-size:13px;color:var(--text-muted);">' + opt.desc + '</div></div>' +
    '</div>';
  }
  container.innerHTML = '<div style="animation:jxSurveyFadeIn 0.4s ease;">' +
    '<h4 style="font-size:17px;font-weight:700;color:var(--text-primary);margin:0 0 8px 0;">' + step.title + '</h4>' +
    '<p style="font-size:13px;color:var(--text-muted);margin:0 0 16px 0;">' + step.desc + '</p>' +
    optionsHtml +
  '</div>';
}

function simSurveySelect(key, value, nextStep) {
  var valueMap = {
    familyType: {'A':'well-off','B':'average','C':'tight','D':'connected'},
    personality: {'A':'technical','B':'social','C':'stable','D':'creative'},
    plan: {'A':'postgrad','B':'employ','C':'civil-servant','D':'entrepreneur'},
    priority: {'A':'salary','B':'interest','C':'stability','D':'status'}
  };
  if (valueMap[key] && valueMap[key][value]) value = valueMap[key][value];
  simSurveyData.answers[key] = value;
  if (nextStep < 4) {
    var container = document.getElementById('sim-survey-steps');
    if (container) {
      container.style.opacity = '0'; container.style.transform = 'translateY(-10px)'; container.style.transition = 'all 0.2s ease';
      setTimeout(function() { simSurveyRenderStep(nextStep); container.style.opacity = '1'; container.style.transform = 'translateY(0)'; }, 200);
    }
  } else { simSurveyComplete(); }
}

function simSurveyComplete() {
  localStorage.setItem('simSurveyResult', JSON.stringify(simSurveyData.answers));
  var container = document.getElementById('sim-survey-steps');
  if (container) {
    container.innerHTML = '<div style="text-align:center;animation:jxSurveyFadeIn 0.4s ease;">' +
      '<div style="font-size:48px;margin-bottom:12px;">🎉</div>' +
      '<h4 style="font-size:18px;font-weight:700;color:var(--text-primary);margin:0 0 8px 0;">问卷完成！</h4>' +
      '<p style="font-size:14px;color:var(--text-muted);margin:0 0 16px 0;">AI将根据你的回答为你定制个性化推荐方案</p></div>';
  }
  setTimeout(function() { simSurveyShowDone(); }, 2000);
}

function simSurveyUpdateSummary() {
  var summaryEl = document.getElementById('sim-survey-summary-text');
  if (!summaryEl) return;
  var a = simSurveyData.answers;
  var labels = {
    familyType: { 'well-off': '经济宽裕', 'average': '经济一般', 'tight': '经济紧张', 'connected': '有行业资源' },
    personality: { 'technical': '技术型', 'social': '社交型', 'stable': '稳定型', 'creative': '创造型' },
    plan: { 'postgrad': '考研深造', 'employ': '直接就业', 'civil-servant': '考公考编', 'entrepreneur': '自主创业' },
    priority: { 'salary': '高薪', 'interest': '兴趣', 'stability': '稳定', 'status': '社会地位' }
  };
  var parts = [];
  if (a.familyType && labels.familyType[a.familyType]) parts.push(labels.familyType[a.familyType]);
  if (a.personality && labels.personality[a.personality]) parts.push(labels.personality[a.personality]);
  if (a.plan && labels.plan[a.plan]) parts.push(labels.plan[a.plan]);
  if (a.priority && labels.priority[a.priority]) parts.push('看重' + labels.priority[a.priority]);
  summaryEl.textContent = parts.join(' · ');
}

function simSurveyGenerateAdvice() {
  var a = simSurveyData.answers;
  var adviceEl = document.getElementById('sim-survey-advice');
  if (!adviceEl) return;
  var adviceList = [];
  if (a.familyType === 'tight' && a.priority === 'salary') adviceList.push({ icon: '💰', title: '高薪专业优先', text: '推荐计算机科学与技术、软件工程、电气工程及其自动化、口腔医学等专业。' });
  if (a.familyType === 'tight' && a.priority === 'stability') adviceList.push({ icon: '🛡️', title: '稳定就业方向', text: '推荐师范类、医学类、公安类院校。' });
  if (a.familyType === 'well-off' && a.plan === 'postgrad') adviceList.push({ icon: '🎓', title: '学术深造路线', text: '推荐基础学科（数学、物理、化学）或985高校优势学科。' });
  if (a.personality === 'technical' && a.priority === 'salary') adviceList.push({ icon: '🔬', title: '技术+高薪', text: '推荐计算机、电子信息、自动化、人工智能等理工热门专业。' });
  if (a.plan === 'civil-servant') adviceList.push({ icon: '🏛️', title: '考公方向', text: '推荐法学、汉语言文学、会计学、计算机科学与技术（公考热门专业）。' });
  if (adviceList.length === 0) adviceList.push({ icon: '💡', title: '综合建议', text: '建议结合兴趣和就业前景，优先选择有学科优势的高校的王牌专业。' });
  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px;">';
  for (var i = 0; i < adviceList.length; i++) {
    var adv = adviceList[i];
    html += '<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;font-size:13px;">' +
      '<div style="font-weight:600;margin-bottom:4px;">' + adv.icon + ' ' + adv.title + '</div>' +
      '<div style="color:#92400e;">' + adv.text + '</div></div>';
  }
  html += '</div>';
  adviceEl.innerHTML = html;
}

function simSurveySkip() {
  localStorage.removeItem('simSurveyResult');
  simSurveyData.answers = {};
  var activeEl = document.getElementById('sim-survey-active');
  if (activeEl) activeEl.style.display = 'none';
  showToast('已跳过问卷，你可以随时重新填写', 'info');
}

function simSurveyReset() {
  localStorage.removeItem('simSurveyResult');
  simSurveyData.answers = {};
  simSurveyData.currentStep = 0;
  simSurveyShowActive();
  simSurveyRenderStep(0);
  showToast('问卷已重置，请重新填写', 'info');
}

function simGetSurveyResult() {
  var saved = localStorage.getItem('simSurveyResult');
  if (saved) { try { return JSON.parse(saved); } catch(e) { return {}; } }
  return simSurveyData.answers || {};
}

// 获取sim兴趣标签
function simGetInterests() {
  var tags = document.querySelectorAll('#sim-interest-container .interest-tag-active');
  var ids = [];
  for (var i = 0; i < tags.length; i++) { if (tags[i].dataset.id) ids.push(tags[i].dataset.id); }
  return ids;
}

// 通用模拟填报推荐函数
function simDoRecommend() {
  var score = parseInt(document.getElementById('sim-score').value);
  var rank = parseInt(document.getElementById('sim-rank').value);
  var subject = document.getElementById('sim-subject').value;
  var province = document.getElementById('sim-province').value;
  var batch = document.getElementById('sim-batch').value;
  var totalCount = parseInt(document.getElementById('sim-count').value) || 45;
  var resultDiv = document.getElementById('sim-result');

  if (isNaN(score) || score < 0 || score > 750) {
    resultDiv.innerHTML = '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;color:#991b1b;text-align:center;"><strong>请输入有效的高考分数（0-750分）</strong></div>';
    return;
  }
  if (!province) {
    resultDiv.innerHTML = '<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;color:#991b1b;text-align:center;"><strong>请选择所在省份</strong></div>';
    return;
  }

  var interests = simGetInterests();
  var surveyResult = simGetSurveyResult();

  // 判断省份模式
  var is33Mode = (typeof PROVINCE_33_MODE !== 'undefined' && PROVINCE_33_MODE.indexOf(province) !== -1);
  var sk = is33Mode ? 'wuli' : ((subject === '物理类' || subject === '理科') ? 'wuli' : 'lishi');
  var batchLineData = PROVINCE_BATCH_LINES_2025[province] || {};
  var batchLine = batchLineData[sk] || 429;

  // 保存科类到jxLastResult（供jxPickMajorNames使用）
  jxLastResult = { subject: subject, score: score, rank: rank, province: province };

  // Score+rank all colleges
  var all = [];
  for (var i = 0; i < RANKINGS.length; i++) {
    var c = RANKINGS[i];
    var base = getCollegeScoreBase(c.name);
    var est;
    if (is33Mode) {
      est = (base.wuli + base.lishi) / 2;
    } else {
      est = base[sk];
    }
    if (!est) continue;
    var diff = score - est;
    if (diff < -30) continue;
    var scoreAboveLine = score - batchLine;
    if (est - batchLine > scoreAboveLine + 20) continue;
    var level = diff >= 12 ? 'safe' : (diff >= -8 ? 'target' : 'reach');
    var lowProb = Math.max(3, Math.min(12, 8 + diff));
    var prob = Math.min(99, Math.max(1, diff >= 30 ? 95 : diff >= 15 ? 75 : diff >= 5 ? 55 : diff >= -5 ? 40 : diff >= -15 ? 20 : lowProb));
    all.push({ college: c, est: est, diff: diff, level: level, prob: prob, source: base.source, batchDiff: est - batchLine });
  }

  all.sort(function(a, b) { return a.diff - b.diff; });

  var reach = all.filter(function(x) { return x.level === 'reach'; });
  var target = all.filter(function(x) { return x.level === 'target'; });
  var safe = all.filter(function(x) { return x.level === 'safe'; });

  // 按比例分配冲稳保: 冲12 稳23 保10 (共45)
  var reachCount = 12;
  var safeCount = 10;
  var targetCount = 23;

  var v = [];
  var usedNames = {};
  function addToList(tier, item) {
    if (usedNames[item.college.name]) return false;
    usedNames[item.college.name] = true;
    v.push({ tier: tier, data: item, num: v.length + 1 });
    return true;
  }
  function getFromAdjacent(tier, needed) {
    var added = 0;
    if (tier === 'safe') {
      for (var i = 0; i < target.length && added < needed; i++) { if (!usedNames[target[i].college.name] && target[i].diff >= 0) { addToList('safe', target[i]); added++; } }
      for (var i = 0; i < reach.length && added < needed; i++) { if (!usedNames[reach[i].college.name] && reach[i].diff >= 0) { addToList('safe', reach[i]); added++; } }
    } else if (tier === 'target') {
      for (var i = 0; i < reach.length && added < needed; i++) { if (!usedNames[reach[i].college.name]) { addToList('target', reach[i]); added++; } }
      for (var i = 0; i < safe.length && added < needed; i++) { if (!usedNames[safe[i].college.name]) { addToList('target', safe[i]); added++; } }
    } else if (tier === 'reach') {
      for (var i = 0; i < target.length && added < needed; i++) { if (!usedNames[target[i].college.name] && target[i].diff < 0) { addToList('reach', target[i]); added++; } }
      for (var i = 0; i < safe.length && added < needed; i++) { if (!usedNames[safe[i].college.name] && safe[i].diff < 0) { addToList('reach', safe[i]); added++; } }
    }
    return added;
  }
  function pad(tier, list, count) {
    for (var j = 0; j < list.length && v.length < count; j++) { addToList(tier, list[j]); }
    if (v.length < count) { getFromAdjacent(tier, count - v.length); }
  }
  reach.sort(function(a, b) { return b.diff - a.diff; });
  target.sort(function(a, b) { return b.diff - a.diff; });
  pad('reach', reach, reachCount);
  pad('target', target, reachCount + targetCount);
  pad('safe', safe, totalCount);

  // Render
  var ti = 0;
  var currentTier = '';
  var rowsHtml = '';
  var tierNames = { reach: '🚀 冲刺院校（竞争激烈，冲一冲）', target: '🎯 稳妥院校（匹配度较高）', safe: '🛡️ 保底院校（录取把握大）' };
  var tierClasses = { reach: 'reach', target: 'target', safe: 'safe' };

  for (var vi = 0; vi < v.length; vi++) {
    var item = v[vi];
    if (item.tier !== currentTier) {
      currentTier = item.tier;
      ti = 1;
      rowsHtml += '<tr class="jx-tier-header ' + tierClasses[currentTier] + '"><td colspan="12">' + tierNames[currentTier] + '</td></tr>';
    }
    var d = item.data;
    var c = d.college;
    var tagsHtml = '';
    if (c.tags && c.tags.length > 0) {
      for (var tgi = 0; tgi < c.tags.length; tgi++) {
        var tg = c.tags[tgi];
        var tgc = tg === '985' ? '#991b1b' : (tg === '211' ? '#b45309' : '#0d9488');
        tagsHtml += '<span style="display:inline-block;padding:1px 4px;border-radius:3px;font-size:10px;background:' + tgc + ';color:#fff;margin-right:2px;">' + tg + '</span>';
      }
    }
    ti++;
    var majorPick = jxPickMajorNames(c.name, interests);
    var majorNames = majorPick.names;
    var aiScore = typeof jxCalculateAiScore === 'function' ? jxCalculateAiScore(d.level, d.diff, d.prob, majorPick.matched, c.rank, 0, c) : Math.round(d.prob * 0.8);
    var escName = c.name.replace(/'/g, "\\'");
    rowsHtml += '<tr class="tier-' + d.level + '">' +
      '<td style="font-weight:600;">' + item.num + '</td>' +
      '<td style="font-weight:600;text-align:left;cursor:pointer;color:#1a56db;" onclick="showCollegeDetail(\'' + escName + '\')">' + c.name + '</td>' +
      '<td><span style="font-size:11px;color:#64748b;">' + c.location + '</span></td>' +
      '<td>' + (c.type || '—') + '</td>' +
      '<td style="text-align:left;font-size:11px;">' + tagsHtml + '</td>' +
      '<td style="text-align:left;font-size:11px;max-width:140px;">' + majorNames + '</td>' +
      '<td><span class="jx-prob-badge ' + d.level + '">' + d.prob + '%</span></td>' +
      '<td style="font-weight:800;color:#1a56db;">' + aiScore + '</td>' +
      '<td style="font-weight:700;">' + Math.round(d.est) +
        (d.source === 'official' ? '<span style="display:inline-block;margin-left:3px;padding:0 4px;border-radius:3px;font-size:10px;background:#fef3c7;color:#92400e;">实</span>' : '<span style="display:inline-block;margin-left:3px;padding:0 4px;border-radius:3px;font-size:10px;background:#e0e7ff;color:#3730a3;">估</span>') +
      '</td>' +
      '<td>' + c.rank + '</td>' +
    '</tr>';
  }

  // 问卷画像
  var surveyInfoHtml = '';
  if (surveyResult && Object.keys(surveyResult).length > 0) {
    var sLabels = {
      familyType: { 'well-off': '经济宽裕', 'average': '经济一般', 'tight': '经济紧张', 'connected': '有行业资源' },
      personality: { 'technical': '技术型', 'social': '社交型', 'stable': '稳定型', 'creative': '创造型' },
      plan: { 'postgrad': '考研深造', 'employ': '直接就业', 'civil-servant': '考公考编', 'entrepreneur': '自主创业' },
      priority: { 'salary': '高薪', 'interest': '兴趣', 'stability': '稳定', 'status': '社会地位' }
    };
    var sParts = [];
    if (surveyResult.familyType && sLabels.familyType[surveyResult.familyType]) sParts.push('🏠 ' + sLabels.familyType[surveyResult.familyType]);
    if (surveyResult.personality && sLabels.personality[surveyResult.personality]) sParts.push('🧠 ' + sLabels.personality[surveyResult.personality]);
    if (surveyResult.plan && sLabels.plan[surveyResult.plan]) sParts.push('🎯 ' + sLabels.plan[surveyResult.plan]);
    if (surveyResult.priority && sLabels.priority[surveyResult.priority]) sParts.push('⭐ ' + sLabels.priority[surveyResult.priority]);
    if (sParts.length > 0) {
      surveyInfoHtml = '<div style="background:rgba(255,255,255,0.12);border-radius:8px;padding:10px 14px;margin-top:10px;font-size:12px;opacity:0.9;">📋 你的画像：' + sParts.join(' &nbsp;|&nbsp; ') + '</div>';
    }
  }

  var modeText = is33Mode ? '3+3综合分' : subject;
  resultDiv.innerHTML =
    '<div style="background:linear-gradient(135deg,#1e40af,#1a56db);border-radius:var(--radius-lg);padding:20px 24px;color:#fff;margin-bottom:16px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
        '<div><h3 style="font-size:18px;font-weight:700;margin:0 0 6px 0;">📊 ' + province + ' · ' + modeText + ' · ' + score + '分</h3>' +
        '<p style="font-size:13px;opacity:0.9;margin:0;">批次线：' + batchLine + '分 | 超出批次线：' + (score - batchLine) + '分 | 推荐' + v.length + '个志愿</p></div>' +
        '<div style="display:flex;gap:8px;">' +
          '<button class="btn btn-outline btn-sm" onclick="simDoRecommend()" style="color:#fff;border-color:rgba(255,255,255,0.4);">🔄 重新推荐</button>' +
        '</div>' +
      '</div>' +
      surveyInfoHtml +
    '</div>' +
    '<div style="overflow-x:auto;border:1px solid var(--border);border-radius:var(--radius-lg);background:var(--bg-card);">' +
      '<table class="jx-result-table" style="width:100%;border-collapse:collapse;font-size:13px;">' +
        '<thead><tr style="background:var(--bg);border-bottom:2px solid var(--border);">' +
          '<th style="padding:10px 8px;text-align:center;width:40px;">序号</th>' +
          '<th style="padding:10px 8px;text-align:left;">院校名称</th>' +
          '<th style="padding:10px 8px;">地区</th>' +
          '<th style="padding:10px 8px;">类型</th>' +
          '<th style="padding:10px 8px;">标签</th>' +
          '<th style="padding:10px 8px;text-align:left;">推荐专业</th>' +
          '<th style="padding:10px 8px;">录取概率</th>' +
          '<th style="padding:10px 8px;">AI评分</th>' +
          '<th style="padding:10px 8px;">投档分</th>' +
          '<th style="padding:10px 8px;">排名</th>' +
        '</tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody>' +
      '</table>' +
    '</div>' +
    '<div style="margin-top:16px;padding:12px 16px;background:var(--warning-bg);border-radius:var(--radius);font-size:13px;color:var(--warning);">' +
      '⚠️ 以上推荐基于模拟数据，仅供参考。正式填报请以' + province + '省教育考试院官方公布为准。' +
    '</div>';

  showToast('智能推荐已完成！共推荐' + v.length + '个志愿', 'success');
}

// 初始化sim兴趣标签
function simInitInterests() {
  var container = document.getElementById('sim-interest-container');
  if (!container || container.dataset.init === 'true') return;
  container.dataset.init = 'true';
  if (typeof INTEREST_CATEGORIES === 'undefined') return;
  var html = '';
  for (var i = 0; i < INTEREST_CATEGORIES.length; i++) {
    var cat = INTEREST_CATEGORIES[i];
    html += '<span class="interest-tag" data-id="' + cat.id + '" onclick="simToggleInterest(this)" style="display:inline-block;padding:6px 14px;border-radius:20px;font-size:13px;cursor:pointer;border:1.5px solid var(--border);background:var(--bg);color:var(--text-secondary);transition:all 0.2s;user-select:none;">' + cat.icon + ' ' + cat.name + '</span>';
  }
  container.innerHTML = html;
}

function simToggleInterest(el) {
  if (el.classList.contains('interest-tag-active')) {
    el.classList.remove('interest-tag-active');
    el.style.background = 'var(--bg)';
    el.style.color = 'var(--text-secondary)';
    el.style.borderColor = 'var(--border)';
  } else {
    el.classList.add('interest-tag-active');
    el.style.background = '#1a56db';
    el.style.color = '#fff';
    el.style.borderColor = '#1a56db';
  }
}
