// 2025年各省高考本科批控制线（数据来源：各省教育考试院官方公布）
// 3+3模式省份：山东、浙江、北京、天津、上海、海南（满分750/660，不分物理/历史类）
// 3+1+2模式省份：江西、湖南、湖北、广东、河北、安徽、河南、四川、福建、甘肃、贵州、辽宁、江苏、陕西、广西、云南、山西、重庆、吉林、黑龙江、内蒙古、宁夏、青海、新疆
// 旧高考模式省份：西藏（2025年仍为文理分科）
var PROVINCE_BATCH_LINES_2025 = {
  // 3+1+2省份（区分物理类/历史类）
  '江西':   { wuli: 429, wuliSpecial: 505, lishi: 486, lishiSpecial: 539, mode: '3+1+2' },
  '湖南':   { wuli: 405, wuliSpecial: 476, lishi: 446, lishiSpecial: 503, mode: '3+1+2' },
  '湖北':   { wuli: 426, wuliSpecial: 516, lishi: 442, lishiSpecial: 536, mode: '3+1+2' },
  '广东':   { wuli: 436, wuliSpecial: 534, lishi: 464, lishiSpecial: 557, mode: '3+1+2' },
  '河北':   { wuli: 459, wuliSpecial: 499, lishi: 477, lishiSpecial: 527, mode: '3+1+2' },
  '安徽':   { wuli: 461, wuliSpecial: 514, lishi: 477, lishiSpecial: 515, mode: '3+1+2' },
  '河南':   { wuli: 427, wuliSpecial: 535, lishi: 471, lishiSpecial: 552, mode: '3+1+2' },
  '四川':   { wuli: 438, wuliSpecial: 518, lishi: 467, lishiSpecial: 533, mode: '3+1+2' },
  '福建':   { wuli: 441, wuliSpecial: 520, lishi: 450, lishiSpecial: 531, mode: '3+1+2' },
  '甘肃':   { wuli: 374, wuliSpecial: 475, lishi: 412, lishiSpecial: 500, mode: '3+1+2' },
  '贵州':   { wuli: 387, wuliSpecial: 483, lishi: 458, lishiSpecial: 517, mode: '3+1+2' },
  '辽宁':   { wuli: 367, wuliSpecial: 515, lishi: 437, lishiSpecial: 522, mode: '3+1+2' },
  '江苏':   { wuli: 463, wuliSpecial: 519, lishi: 482, lishiSpecial: 537, mode: '3+1+2' },
  '重庆':   { wuli: 425, wuliSpecial: 498, lishi: 438, lishiSpecial: 515, mode: '3+1+2' },
  '吉林':   { wuli: 340, wuliSpecial: 479, lishi: 384, lishiSpecial: 493, mode: '3+1+2' },
  '黑龙江': { wuli: 360, wuliSpecial: 472, lishi: 405, lishiSpecial: 480, mode: '3+1+2' },
  '内蒙古': { wuli: 375, wuliSpecial: 487, lishi: 418, lishiSpecial: 523, mode: '3+1+2' },
  '宁夏':   { wuli: 372, wuliSpecial: 441, lishi: 404, lishiSpecial: 482, mode: '3+1+2' },
  '青海':   { wuli: 350, wuliSpecial: 420, lishi: 405, lishiSpecial: 450, mode: '3+1+2' },
  '陕西':   { wuli: 394, wuliSpecial: 473, lishi: 414, lishiSpecial: 497, mode: '3+1+2' },
  '广西':   { wuli: 370, wuliSpecial: 495, lishi: 402, lishiSpecial: 518, mode: '3+1+2' },
  '云南':   { wuli: 430, wuliSpecial: 495, lishi: 465, lishiSpecial: 535, mode: '3+1+2' },
  '山西':   { wuli: 419, wuliSpecial: 507, lishi: 443, lishiSpecial: 534, mode: '3+1+2' },
  '新疆':   { wuli: 280, wuliSpecial: 421, lishi: 330, lishiSpecial: 451, mode: 'old' },
  // 3+3模式省份（不分物理/历史类，使用综合分）
  '山东':   { wuli: 441, wuliSpecial: 521, lishi: 441, lishiSpecial: 521, mode: '3+3' },
  '浙江':   { wuli: 490, wuliSpecial: 592, lishi: 490, lishiSpecial: 592, mode: '3+3' },
  '北京':   { wuli: 430, wuliSpecial: 519, lishi: 430, lishiSpecial: 519, mode: '3+3' },
  '天津':   { wuli: 476, wuliSpecial: 562, lishi: 476, lishiSpecial: 562, mode: '3+3' },
  '上海':   { wuli: 402, wuliSpecial: 505, lishi: 402, lishiSpecial: 505, mode: '3+3', totalScore: 660 },
  '海南':   { wuli: 480, wuliSpecial: 568, lishi: 480, lishiSpecial: 568, mode: '3+3' },
  // 旧高考模式省份
  '西藏':   { wuli: 305, wuliSpecial: 400, lishi: 315, lishiSpecial: 410, mode: 'old' }
};

// 3+3新高考模式省份列表（不分物理/历史类，使用综合分）
var PROVINCE_33_MODE = ['山东', '浙江', '北京', '天津', '上海', '海南'];

// 各省985代表院校投档分（普通批最低分，数据来源：各省教育考试院/阳光高考）
// 格式：{ wuli: 分, lishi: 分 }，null 表示该省该科类未查到
var PROVINCE_TOP_SCORES_2025 = {
  '江西': {
    '清华大学': { wuli: 672, lishi: 662 }, '北京大学': { wuli: 673, lishi: 661 },
    '上海交通大学': { wuli: 657, lishi: 653 }, '复旦大学': { wuli: 659, lishi: 646 },
    '浙江大学': { wuli: 659, lishi: 642 }, '南京大学': { wuli: 646, lishi: 642 },
    '武汉大学': { wuli: 625, lishi: 633 }, '华中科技大学': { wuli: 586, lishi: 615 },
    '南昌大学': { wuli: 545, lishi: 583 }, '江西财经大学': { wuli: 513, lishi: 576 }
  },
  '湖南': {
    '清华大学': { wuli: 685, lishi: 665 }, '北京大学': { wuli: 685, lishi: 660 },
    '上海交通大学': { wuli: 671, lishi: null }, '复旦大学': { wuli: 669, lishi: null },
    '浙江大学': { wuli: 672, lishi: null }, '南京大学': { wuli: 666, lishi: null },
    '武汉大学': { wuli: 639, lishi: null }, '华中科技大学': { wuli: 646, lishi: null },
    '中南大学': { wuli: 625, lishi: null }, '湖南大学': { wuli: 624, lishi: null }
  },
  '湖北': {
    '清华大学': { wuli: 682, lishi: 674 }, '北京大学': { wuli: 682, lishi: 668 },
    '上海交通大学': { wuli: 682, lishi: 663 }, '复旦大学': { wuli: 670, lishi: 654 },
    '浙江大学': { wuli: null, lishi: 647 }, '南京大学': { wuli: 666, lishi: 646 },
    '武汉大学': { wuli: 634, lishi: 628 }, '华中科技大学': { wuli: 640, lishi: 614 }
  },
  '广东': {
    '清华大学': { wuli: 688, lishi: 675 }, '北京大学': { wuli: 689, lishi: 669 },
    '复旦大学': { wuli: 678, lishi: null }, '浙江大学': { wuli: 677, lishi: null },
    '南京大学': { wuli: 674, lishi: 649 }, '华南理工大学': { wuli: 622, lishi: null },
    '中山大学': { wuli: 609, lishi: null }, '武汉大学': { wuli: 609, lishi: 616 }
  },
  '河北': {
    '清华大学': { wuli: 688, lishi: 679 }, '北京大学': { wuli: 688, lishi: 671 },
    '上海交通大学': { wuli: 681, lishi: 660 }, '复旦大学': { wuli: 680, lishi: 667 },
    '浙江大学': { wuli: 679, lishi: 657 }, '南京大学': { wuli: 674, lishi: 659 },
    '中国人民大学': { wuli: 669, lishi: 650 }, '北京航空航天大学': { wuli: 673, lishi: 661 },
    '武汉大学': { wuli: 652, lishi: 630 }, '西安交通大学': { wuli: 661, lishi: 637 }
  },
  '安徽': {
    '清华大学': { wuli: 688, lishi: 670 }, '北京大学': { wuli: 687, lishi: 667 },
    '上海交通大学': { wuli: 678, lishi: null }, '复旦大学': { wuli: 679, lishi: 657 },
    '浙江大学': { wuli: 678, lishi: null }, '南京大学': { wuli: 672, lishi: 649 },
    '中国科学技术大学': { wuli: 673, lishi: null }, '武汉大学': { wuli: 654, lishi: null },
    '华中科技大学': { wuli: 660, lishi: null }, '合肥工业大学': { wuli: null, lishi: null }
  },
  '河南': {
    '清华大学': { wuli: 700, lishi: 687 }, '北京大学': { wuli: 697, lishi: 673 },
    '上海交通大学': { wuli: 691, lishi: 669 }, '复旦大学': { wuli: 690, lishi: 666 },
    '浙江大学': { wuli: 688, lishi: 660 }, '南京大学': { wuli: 683, lishi: 662 },
    '中国科学技术大学': { wuli: 683, lishi: null }, '武汉大学': { wuli: 664, lishi: 650 },
    '华中科技大学': { wuli: 667, lishi: 634 }, '郑州大学': { wuli: null, lishi: null }
  },
  '四川': {
    '清华大学': { wuli: 687, lishi: 668 }, '北京大学': { wuli: 690, lishi: 663 },
    '上海交通大学': { wuli: 668, lishi: 658 }, '复旦大学': { wuli: 676, lishi: 653 },
    '浙江大学': { wuli: 652, lishi: 650 }, '南京大学': { wuli: 670, lishi: 648 },
    '电子科技大学': { wuli: 653, lishi: 613 }, '四川大学': { wuli: 601, lishi: 599 }
  },
  '福建': {
    '清华大学': { wuli: 684, lishi: 669 }, '北京大学': { wuli: 686, lishi: 665 },
    '上海交通大学': { wuli: 674, lishi: 658 }, '复旦大学': { wuli: 673, lishi: 649 },
    '浙江大学': { wuli: 673, lishi: null }, '厦门大学': { wuli: null, lishi: null },
    '兰州大学': { wuli: 607, lishi: 593 }
  },
  '甘肃': {
    '清华大学': { wuli: 668, lishi: 660 }, '北京大学': { wuli: 667, lishi: 651 },
    '上海交通大学': { wuli: 665, lishi: null }, '复旦大学': { wuli: 662, lishi: 644 },
    '浙江大学': { wuli: 655, lishi: null }, '兰州大学': { wuli: 538, lishi: 562 },
    '西北农林科技大学': { wuli: 547, lishi: 573 }
  },
  // ===== 新增21省数据 =====
  '山东': {
    '清华大学': { wuli: 681, lishi: 681 }, '北京大学': { wuli: 684, lishi: 684 },
    '浙江大学': { wuli: 660, lishi: 660 }, '南京大学': { wuli: 658, lishi: 658 },
    '复旦大学': { wuli: 668, lishi: 668 }, '上海交通大学': { wuli: 672, lishi: 672 },
    '武汉大学': { wuli: 643, lishi: 643 }, '华中科技大学': { wuli: 639, lishi: 639 },
    '山东大学': { wuli: 617, lishi: 617 }, '中国海洋大学': { wuli: 602, lishi: 602 }
  },
  '浙江': {
    '清华大学': { wuli: 697, lishi: 697 }, '北京大学': { wuli: 700, lishi: 700 },
    '浙江大学': { wuli: 658, lishi: 658 }, '南京大学': { wuli: 677, lishi: 677 },
    '复旦大学': { wuli: 691, lishi: 691 }, '上海交通大学': { wuli: 696, lishi: 696 },
    '武汉大学': { wuli: 660, lishi: 660 }, '华中科技大学': { wuli: 656, lishi: 656 }
  },
  '北京': {
    '清华大学': { wuli: 685, lishi: 685 }, '北京大学': { wuli: 686, lishi: 686 },
    '浙江大学': { wuli: 673, lishi: 673 }, '南京大学': { wuli: 670, lishi: 670 },
    '复旦大学': { wuli: 679, lishi: 679 }, '上海交通大学': { wuli: 672, lishi: 672 },
    '武汉大学': { wuli: 654, lishi: 654 }, '中国人民大学': { wuli: 669, lishi: 669 }
  },
  '天津': {
    '清华大学': { wuli: 695, lishi: 695 }, '北京大学': { wuli: 691, lishi: 691 },
    '浙江大学': { wuli: 674, lishi: 674 }, '南京大学': { wuli: 681, lishi: 681 },
    '复旦大学': { wuli: 670, lishi: 670 }, '上海交通大学': { wuli: 668, lishi: 668 },
    '南开大学': { wuli: 649, lishi: 649 }, '天津大学': { wuli: 649, lishi: 649 }
  },
  '上海': {
    '清华大学': { wuli: 580, lishi: 580 }, '北京大学': { wuli: 580, lishi: 580 },
    '复旦大学': { wuli: 594, lishi: 594 }, '上海交通大学': { wuli: 586, lishi: 586 },
    '同济大学': { wuli: 576, lishi: 576 }, '华东师范大学': { wuli: 565, lishi: 565 },
    '武汉大学': { wuli: 572, lishi: 572 }, '华中科技大学': { wuli: 570, lishi: 570 }
  },
  '海南': {
    '清华大学': { wuli: 826, lishi: 826 }, '北京大学': { wuli: 827, lishi: 827 },
    '复旦大学': { wuli: 819, lishi: 819 }, '上海交通大学': { wuli: 826, lishi: 826 },
    '浙江大学': { wuli: 806, lishi: 806 }, '南京大学': { wuli: 789, lishi: 789 },
    '武汉大学': { wuli: 747, lishi: 747 }, '海南大学': { wuli: 635, lishi: 635 }
  },
  '辽宁': {
    '清华大学': { wuli: 688, lishi: 663 }, '北京大学': { wuli: 695, lishi: 653 },
    '浙江大学': { wuli: 665, lishi: 645 }, '南京大学': { wuli: 676, lishi: 637 },
    '复旦大学': { wuli: 685, lishi: 641 }, '上海交通大学': { wuli: 683, lishi: 638 },
    '大连理工大学': { wuli: 618, lishi: 586 }, '东北大学': { wuli: 621, lishi: 600 }
  },
  '江苏': {
    '清华大学': { wuli: 684, lishi: 679 }, '北京大学': { wuli: 686, lishi: 666 },
    '浙江大学': { wuli: 670, lishi: 642 }, '南京大学': { wuli: 665, lishi: 643 },
    '复旦大学': { wuli: 672, lishi: 656 }, '上海交通大学': { wuli: 673, lishi: 659 },
    '东南大学': { wuli: 655, lishi: 625 }, '武汉大学': { wuli: 651, lishi: 639 }
  },
  '重庆': {
    '清华大学': { wuli: 692, lishi: 667 }, '北京大学': { wuli: 693, lishi: 661 },
    '浙江大学': { wuli: 676, lishi: 642 }, '南京大学': { wuli: 670, lishi: 641 },
    '复旦大学': { wuli: 676, lishi: 651 }, '上海交通大学': { wuli: 676, lishi: 653 },
    '重庆大学': { wuli: 606, lishi: 595 }, '武汉大学': { wuli: 653, lishi: 630 }
  },
  '吉林': {
    '清华大学': { wuli: 676, lishi: 652 }, '北京大学': { wuli: 678, lishi: 649 },
    '浙江大学': { wuli: 676, lishi: 640 }, '南京大学': { wuli: 671, lishi: 648 },
    '复旦大学': { wuli: 678, lishi: 652 }, '上海交通大学': { wuli: 675, lishi: 660 },
    '吉林大学': { wuli: 560, lishi: 595 }, '武汉大学': { wuli: 645, lishi: 620 }
  },
  '黑龙江': {
    '清华大学': { wuli: 682, lishi: 665 }, '北京大学': { wuli: 682, lishi: 657 },
    '浙江大学': { wuli: 677, lishi: 630 }, '南京大学': { wuli: 666, lishi: 638 },
    '复旦大学': { wuli: 682, lishi: 649 }, '上海交通大学': { wuli: 682, lishi: 653 },
    '哈尔滨工业大学': { wuli: 646, lishi: 602 }, '武汉大学': { wuli: 634, lishi: 610 }
  },
  '内蒙古': {
    '清华大学': { wuli: 693, lishi: 681 }, '北京大学': { wuli: 694, lishi: 675 },
    '浙江大学': { wuli: 683, lishi: 659 }, '南京大学': { wuli: 680, lishi: 657 },
    '复旦大学': { wuli: 685, lishi: 665 }, '上海交通大学': { wuli: 662, lishi: 654 },
    '武汉大学': { wuli: 603, lishi: 649 }, '西安交通大学': { wuli: 628, lishi: 647 }
  },
  '宁夏': {
    '清华大学': { wuli: 662, lishi: 644 }, '北京大学': { wuli: 658, lishi: 637 },
    '浙江大学': { wuli: 645, lishi: 612 }, '南京大学': { wuli: 643, lishi: 612 },
    '复旦大学': { wuli: 648, lishi: 630 }, '上海交通大学': { wuli: 650, lishi: 630 },
    '西安交通大学': { wuli: 615, lishi: 591 }, '武汉大学': { wuli: 620, lishi: 604 }
  },
  '青海': {
    '北京大学': { wuli: 642, lishi: 634 }, '南京大学': { wuli: 622, lishi: 614 },
    '复旦大学': { wuli: 641, lishi: 620 }, '上海交通大学': { wuli: 638, lishi: null },
    '武汉大学': { wuli: 558, lishi: 603 }, '西安交通大学': { wuli: 543, lishi: 558 },
    '青海大学': { wuli: 421, lishi: 450 }, '四川大学': { wuli: 528, lishi: 553 }
  },
  '陕西': {
    '清华大学': { wuli: 698, lishi: 686 }, '北京大学': { wuli: 694, lishi: 680 },
    '浙江大学': { wuli: 672, lishi: 658 }, '南京大学': { wuli: 670, lishi: 656 },
    '复旦大学': { wuli: 691, lishi: 665 }, '上海交通大学': { wuli: 680, lishi: 660 },
    '西安交通大学': { wuli: 644, lishi: 634 }, '西北工业大学': { wuli: 641, lishi: 617 }
  },
  '广西': {
    '清华大学': { wuli: 672, lishi: 659 }, '北京大学': { wuli: 678, lishi: 653 },
    '浙江大学': { wuli: 658, lishi: 640 }, '南京大学': { wuli: 660, lishi: 640 },
    '复旦大学': { wuli: 662, lishi: 646 }, '上海交通大学': { wuli: 665, lishi: 648 },
    '武汉大学': { wuli: 643, lishi: 635 }, '西安交通大学': { wuli: 638, lishi: 616 }
  },
  '云南': {
    '清华大学': { wuli: 681, lishi: 686 }, '北京大学': { wuli: 675, lishi: 670 },
    '浙江大学': { wuli: 660, lishi: 656 }, '南京大学': { wuli: 658, lishi: 650 },
    '复旦大学': { wuli: 668, lishi: 652 }, '上海交通大学': { wuli: 665, lishi: 646 },
    '武汉大学': { wuli: 645, lishi: 634 }, '云南大学': { wuli: 555, lishi: 595 }
  },
  '山西': {
    '清华大学': { wuli: 684, lishi: 666 }, '北京大学': { wuli: 692, lishi: 664 },
    '浙江大学': { wuli: 668, lishi: 647 }, '南京大学': { wuli: 665, lishi: 649 },
    '复旦大学': { wuli: 666, lishi: 653 }, '上海交通大学': { wuli: 668, lishi: 661 },
    '武汉大学': { wuli: 645, lishi: 642 }, '太原理工大学': { wuli: 570, lishi: 548 }
  },
  '新疆': {
    '清华大学': { wuli: 663, lishi: 644 }, '北京大学': { wuli: 666, lishi: 624 },
    '浙江大学': { wuli: 659, lishi: 594 }, '南京大学': { wuli: 656, lishi: 594 },
    '复旦大学': { wuli: 662, lishi: 601 }, '上海交通大学': { wuli: 663, lishi: 609 },
    '新疆大学': { wuli: 470, lishi: 505 }, '武汉大学': { wuli: 635, lishi: 587 }
  },
  '西藏': {
    '清华大学': { wuli: 652, lishi: 628 }, '北京大学': { wuli: 648, lishi: 615 },
    '复旦大学': { wuli: 608, lishi: 588 }, '上海交通大学': { wuli: 605, lishi: null },
    '西藏大学': { wuli: 390, lishi: 420 }, '武汉大学': { wuli: null, lishi: null }
  },
  '贵州': {
    '清华大学': { wuli: 678, lishi: 685 }, '北京大学': { wuli: 680, lishi: 670 },
    '浙江大学': { wuli: 668, lishi: 658 }, '南京大学': { wuli: 665, lishi: 654 },
    '复旦大学': { wuli: 666, lishi: 660 }, '上海交通大学': { wuli: 668, lishi: 664 },
    '武汉大学': { wuli: 648, lishi: 648 }, '贵州大学': { wuli: 530, lishi: 565 }
  }
};
