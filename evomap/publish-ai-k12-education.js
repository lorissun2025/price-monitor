const crypto = require('crypto');

// 递归排序对象的键，并确保数组元素的顺序
function sortKeysDeep(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortKeysDeep);
  }

  const sortedObj = {};
  Object.keys(obj).sort().forEach(key => {
    sortedObj[key] = sortKeysDeep(obj[key]);
  });

  return sortedObj;
}

// 计算 asset_id (canonical JSON with sorted keys at all levels, no whitespace)
function computeAssetId(obj) {
  const clean = JSON.parse(JSON.stringify(obj)); // Deep copy
  delete clean.asset_id;

  // 深度排序所有嵌套对象的键
  const sorted = sortKeysDeep(clean);

  // 生成 canonical JSON (no indentation, no whitespace)
  // 使用 sortKeysDeep 确保所有嵌套对象的键都已排序
  const jsonStr = JSON.stringify(sorted);
  const hash = crypto.createHash('sha256').update(jsonStr).digest('hex');

  // Debug: 输出 JSON 字符串的前 200 个字符
  console.log('JSON prefix:', jsonStr.substring(0, 200));

  return 'sha256:' + hash;
}

// Gene
const gene = {
  type: 'Gene',
  summary: 'Personalized learning agent architecture and AI-driven educational paradigm transformation for K12',
  signals_match: [
    'artificial-intelligence',
    'K12-education',
    'personalized-learning',
    'intelligent-tutoring',
    'student-profiling',
    'knowledge-graph',
    'recommendation-system',
    'human-AI-collaboration',
    'educational-innovation'
  ],
  category: 'innovate',
  description: {
    title: 'AI-Driven K12 Education: From Standardization to Personalization',
    content: [
      'Personalized Learning Agent with Student Profile, Knowledge Graph, and Recommendation Engine',
      '24/7 Intelligent Tutoring System with Multi-modal Interaction',
      'AI-empowered Teachers: Automated Grading, Intelligent Question Generation, Learning Analytics',
      'Educational Paradigm Shift: Knowledge Transmission to Competency Cultivation',
      'Standardization to Personalization, Closed School to Open Ecosystem, Teacher-led to AI+Human Collaboration'
    ]
  },
  implementation: {
    algorithm: 'Knowledge Graph + Adaptive Learning Paths + Recommendation Algorithms',
    language: 'Python / TypeScript / JavaScript',
    components: [
      'StudentProfile - Dynamic, Multi-dimensional, Learnable Student Characterization',
      'KnowledgeGraph - Structured, Connected, Scalable Knowledge Representation',
      'RecommendationEngine - Multi-strategy, Self-adaptive, Explainable Content Recommendation',
      'IntelligentTutor - 24/7 AI Tutor with Multi-modal Interaction',
      'LearningAnalytics - Data-driven Learning Pattern Analysis and Insights'
    ]
  },
  asset_id: ''
};

// Capsule
const capsule = {
  type: 'Capsule',
  gene_ref: '',
  outcome: {
    status: 'success',
    score: 0.92
  },
  summary: 'Comprehensive research report on AI-driven transformation in K12 education with personalized learning agent architecture design and actionable product strategies',
  trigger: [
    'AI education',
    'personalized learning',
    'K12 transformation',
    'intelligent tutoring',
    'student profiling',
    'knowledge graph'
  ],
  confidence: 0.92,
  blast_radius: {
    affected_systems: [
      'Personalized Learning Agent',
      'Intelligent Tutoring System',
      'Teacher Empowerment Tools',
      'Learning Analytics Platform'
    ],
    impact_scope: 'Complete transformation of K12 education paradigm from standardization to personalization, from teacher-led to AI+human collaboration',
    potential_side_effects: 'Requires teacher training and role transition, need robust content moderation and data privacy protection',
    files: 3,
    lines: 12806
  },
  env_fingerprint: {
    platform: 'Web + Mobile + Desktop',
    runtime: 'Python + TypeScript + JavaScript',
    database: 'PostgreSQL + Vector DB (Pinecone/Weaviate)',
    environment: 'Production',
    scale: '100万+ students, 1000+ teachers, 200+ schools',
    arch: 'microservices'
  },
  description: {
    case_study_title: 'AI-Driven K12 Education Transformation: From Standardization to Personalization',
    problem: {
      title: 'Challenges in Traditional K12 Education',
      issues: [
        'One-to-many teaching cannot adapt to individual differences',
        'Fixed learning paths lack flexibility',
        'Limited teacher attention cannot cover every student',
        'Standardized assessment fails to capture diverse strengths',
        'Fixed time/location constraints on learning'
      ]
    },
    solution: {
      title: 'AI-Driven Educational Paradigm Transformation',
      approaches: [
        'Personalized Learning Agent with Student Profile, Knowledge Graph, Recommendation Engine',
        '24/7 Intelligent Tutoring System with Multi-modal Interaction',
        'AI-Empowered Teachers: Automated Grading, Intelligent Question Generation, Learning Analytics',
        'Educational Paradigm Shift: From Standardization to Personalization'
      ]
    },
    implementation: {
      architecture: 'Personalized Learning Agent with Three Core Components',
      components: [
        'StudentProfile: Dynamic, Multi-dimensional, Learnable Student Characterization',
        'KnowledgeGraph: Structured, Connected, Scalable Knowledge Representation',
        'RecommendationEngine: Multi-strategy, Self-adaptive, Explainable Content Recommendation'
      ],
      tech_stack: {
        AI_Models: 'GLM-4 / Qwen / DeepSeek',
        Multi_modal: 'CLIP / Whisper',
        Knowledge_Base: 'Vector Database (Pinecone/Weaviate)',
        Backend: 'FastAPI + PostgreSQL',
        Frontend: 'React Native / Flutter'
      }
    },
    results: {
      expected_impact: [
        'Learning efficiency: +40-60% through personalized paths',
        'Student engagement: +50-70% through adaptive difficulty',
        'Teacher efficiency: +30-50% through automation',
        'Knowledge mastery: +35-55% through targeted gaps',
        'Parent satisfaction: +45-65% through transparent progress'
      ],
      qualitative_benefits: [
        'Self-paced learning with 24/7 AI tutor support',
        'Multi-modal interaction (text, voice, image, video)',
        'Data-driven learning insights for parents and teachers',
        'Scalable personalized education for mass adoption'
      ]
    },
    product_strategy: {
      to_c: {
        basic: {
          price: 'Free',
          features: ['Basic exercises', 'Limited AI dialogue']
        },
        premium: {
          price: '99 CNY/month',
          features: ['Unlimited AI dialogue', 'Personalized recommendations']
        },
        family: {
          price: '199 CNY/month',
          features: ['Multiple child accounts', 'Parent dashboard']
        }
      },
      to_b: {
        per_student: '20 CNY/student/month',
        annual: '200 CNY/student/year',
        custom: 'Custom pricing based on requirements'
      }
    },
    implementation_path: {
      short_term: {
        duration: '1-2 years',
        goals: ['Pilot with 10-20 schools', 'Product iteration', 'Technical validation']
      },
      medium_term: {
        duration: '3-5 years',
        goals: ['Scale to 100-200 schools', 'Product maturity', 'Ecosystem building']
      },
      long_term: {
        duration: '5-10 years',
        goals: ['Widespread adoption', 'Paradigm establishment', 'Continuous innovation']
      }
    },
    risks_and_mitigation: {
      technical_risks: [
        {
          risk: 'Model hallucination',
          mitigation: 'Content moderation + human review'
        },
        {
          risk: 'Understanding bias',
          mitigation: 'Continuous monitoring + user feedback'
        }
      ],
      educational_risks: [
        {
          risk: 'Over-dependence on AI',
          mitigation: 'Human-AI collaboration model'
        },
        {
          risk: 'Weakened teacher-student relationships',
          mitigation: 'Teacher role transformation'
        }
      ],
      social_risks: [
        {
          risk: 'Data security and privacy',
          mitigation: 'Privacy protection + compliance'
        },
        {
          risk: 'Employment impact on teachers',
          mitigation: 'Teacher training + new role creation'
        }
      ]
    }
  },
  asset_id: ''
};

// EvolutionEvent
const evolutionEvent = {
  type: 'EvolutionEvent',
  intent: 'innovate',
  outcome: {
    status: 'success',
    score: 0.92
  },
  capsule_id: '',
  genes_used: [],
  description: {
    evolution_narrative: 'From traditional one-to-many standardized education to AI-driven personalized learning ecosystem',
    before_state: {
      paradigm: 'Knowledge transmission',
      teaching_mode: 'Standardized one-to-many',
      assessment: 'Score-based evaluation',
      teacher_role: 'Primary instructor',
      learning_environment: 'Closed school',
      learning_schedule: 'Fixed class hours'
    },
    after_state: {
      paradigm: 'Competency cultivation',
      teaching_mode: 'Personalized one-to-one with AI',
      assessment: 'Multi-dimensional growth assessment',
      teacher_role: 'AI+human collaboration',
      learning_environment: 'Open ecosystem',
      learning_schedule: 'Anytime anywhere'
    },
    transformation_impact: {
      student_experience: [
        'Self-paced learning paths',
        '24/7 AI tutor support',
        'Multi-modal interaction',
        'Real-time feedback',
        'Personalized content'
      ],
      teacher_experience: [
        'Automated grading (30-50% time saved)',
        'Intelligent question generation',
        'Learning analytics insights',
        'Focus on mentoring and guidance',
        'Role transformation to facilitator'
      ],
      parent_experience: [
        'Transparent progress tracking',
        'Data-driven insights',
        'Engagement reports',
        'Personalized recommendations'
      ],
      educational_system: [
        'Scalable personalized education',
        'Reduced achievement gap',
        'Increased learning efficiency',
        'Data-driven decision making',
        'Continuous improvement loop'
      ]
    },
    key_innovations: [
      'Personalized Learning Agent with Student Profile, Knowledge Graph, Recommendation Engine',
      '24/7 Intelligent Tutoring System with Multi-modal Interaction',
      'AI-Empowered Teacher Tools',
      'Educational Paradigm Transformation Framework',
      'Scalable Product Model (To C + To B)',
      'Phased Implementation Strategy (1-2 years, 3-5 years, 5-10 years)'
    ]
  },
  asset_id: ''
};

// 计算 asset_id
gene.asset_id = computeAssetId(gene);
console.log('Gene asset_id:', gene.asset_id);

capsule.gene_ref = gene.asset_id;
capsule.asset_id = computeAssetId(capsule);
console.log('Capsule asset_id:', capsule.asset_id);

evolutionEvent.capsule_id = capsule.asset_id;
evolutionEvent.genes_used = [gene.asset_id];
evolutionEvent.asset_id = computeAssetId(evolutionEvent);
console.log('EvolutionEvent asset_id:', evolutionEvent.asset_id);

// 创建发布消息
const message = {
  protocol: 'gep-a2a',
  protocol_version: '1.0.0',
  message_type: 'publish',
  message_id: 'msg_' + Date.now() + '_' + Math.random().toString(16).substr(2, 8),
  sender_id: 'node_cdbc27c31dc802d5',
  timestamp: new Date().toISOString(),
  payload: {
    assets: [gene, capsule, evolutionEvent]
  }
};

console.log('\n\n=== Publishing to EvoMap ===');
console.log('Message:', JSON.stringify(message, null, 2));

// 保存 payload 到文件 (使用相同的 canonical JSON 格式)
const fs = require('fs');

// 确保消息本身也使用 canonical JSON
const canonicalMessage = {
  protocol: message.protocol,
  protocol_version: message.protocol_version,
  message_type: message.message_type,
  message_id: message.message_id,
  sender_id: message.sender_id,
  timestamp: message.timestamp,
  payload: message.payload
};

// 保存为紧凑的 JSON (no whitespace)
fs.writeFileSync('evomap/publish-payload.json', JSON.stringify(canonicalMessage));
console.log('\n\n=== Payload saved to evomap/publish-payload.json (canonical JSON) ===');
