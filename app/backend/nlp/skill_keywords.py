"""
Comprehensive skill keywords for CV parsing.
Organized by categories for better matching and classification.
"""

# Technical Skills
PROGRAMMING_LANGUAGES = [
    "python", "java", "javascript", "typescript", "c++", "c#", "c", "ruby", "php", "swift", 
    "kotlin", "go", "rust", "scala", "perl", "r", "matlab", "bash", "powershell", "sql",
    "dart", "objective-c", "assembly", "fortran", "cobol", "lisp", "haskell", "erlang",
    "clojure", "groovy", "lua", "julia", "vba", "delphi", "abap", "apex", "solidity"
]

WEB_TECHNOLOGIES = [
    "html", "css", "sass", "less", "bootstrap", "tailwind", "jquery", "react", "angular", 
    "vue", "svelte", "next.js", "gatsby", "nuxt.js", "redux", "graphql", "rest", "soap",
    "express", "node.js", "django", "flask", "spring", "asp.net", "laravel", "symfony",
    "ruby on rails", "jsp", "php", "wordpress", "drupal", "joomla", "magento", "shopify",
    "webflow", "wix", "squarespace", "webrtc", "websocket", "pwa", "amp", "web components"
]

DATA_SCIENCE = [
    "machine learning", "deep learning", "artificial intelligence", "neural networks", "nlp",
    "natural language processing", "computer vision", "data mining", "statistical analysis",
    "predictive modeling", "regression", "classification", "clustering", "dimensionality reduction",
    "feature engineering", "data visualization", "big data", "data warehousing", "etl",
    "pandas", "numpy", "scipy", "scikit-learn", "tensorflow", "pytorch", "keras", "opencv",
    "spacy", "nltk", "gensim", "huggingface", "transformers", "bert", "gpt", "word2vec",
    "tableau", "power bi", "looker", "data studio", "matplotlib", "seaborn", "plotly", "d3.js",
    "hadoop", "spark", "hive", "pig", "impala", "presto", "airflow", "luigi", "dbt",
    "reinforcement learning", "time series analysis", "anomaly detection", "recommendation systems",
    "a/b testing", "hypothesis testing", "bayesian statistics", "markov chains", "monte carlo"
]

CLOUD_DEVOPS = [
    "aws", "amazon web services", "azure", "microsoft azure", "gcp", "google cloud platform", 
    "docker", "kubernetes", "terraform", "ansible", "chef", "puppet", "jenkins", "gitlab ci",
    "github actions", "circleci", "travis ci", "bitbucket pipelines", "ci/cd", "continuous integration",
    "continuous deployment", "infrastructure as code", "serverless", "lambda", "azure functions",
    "cloud functions", "s3", "ec2", "rds", "dynamodb", "cosmos db", "bigquery", "cloud storage",
    "cloudfront", "cdn", "load balancing", "auto scaling", "high availability", "fault tolerance",
    "disaster recovery", "monitoring", "logging", "prometheus", "grafana", "elk stack", "splunk",
    "datadog", "new relic", "cloudwatch", "stackdriver", "openshift", "istio", "service mesh",
    "microservices", "containers", "virtual machines", "vmware", "hypervisor", "openstack"
]

DATABASE_TECHNOLOGIES = [
    "mysql", "postgresql", "sql server", "oracle", "mongodb", "cassandra", "redis", "elasticsearch",
    "neo4j", "couchdb", "firebase", "dynamodb", "cosmos db", "sqlite", "mariadb", "hbase",
    "influxdb", "timescaledb", "cockroachdb", "snowflake", "redshift", "bigquery", "teradata",
    "vertica", "sybase", "db2", "informix", "sql", "nosql", "acid", "transactions", "indexing",
    "query optimization", "database design", "data modeling", "er diagrams", "normalization",
    "denormalization", "sharding", "replication", "partitioning", "etl", "data migration"
]

MOBILE_DEVELOPMENT = [
    "android", "ios", "swift", "objective-c", "kotlin", "java", "react native", "flutter",
    "xamarin", "ionic", "cordova", "phonegap", "capacitor", "mobile app development",
    "ui/ux design", "responsive design", "progressive web apps", "app store optimization",
    "push notifications", "geolocation", "offline storage", "mobile analytics", "mobile testing",
    "mobile security", "mobile performance", "mobile accessibility", "mobile payments"
]

# Soft Skills
SOFT_SKILLS = [
    "communication", "teamwork", "leadership", "problem solving", "critical thinking",
    "time management", "organization", "adaptability", "flexibility", "creativity",
    "innovation", "emotional intelligence", "conflict resolution", "negotiation",
    "presentation skills", "public speaking", "writing", "active listening",
    "customer service", "client relations", "mentoring", "coaching", "training",
    "decision making", "strategic thinking", "analytical thinking", "attention to detail",
    "multitasking", "prioritization", "stress management", "work ethic", "self-motivation",
    "reliability", "punctuality", "accountability", "integrity", "ethics", "cultural awareness",
    "diversity and inclusion", "empathy", "patience", "resilience", "perseverance"
]

# Business Skills
BUSINESS_SKILLS = [
    "project management", "agile", "scrum", "kanban", "waterfall", "prince2", "pmp",
    "product management", "product development", "business analysis", "requirements gathering",
    "stakeholder management", "risk management", "change management", "quality assurance",
    "quality control", "six sigma", "lean", "process improvement", "business process management",
    "strategic planning", "business strategy", "market analysis", "competitive analysis",
    "financial analysis", "budgeting", "forecasting", "cost-benefit analysis", "roi analysis",
    "sales", "marketing", "digital marketing", "content marketing", "social media marketing",
    "seo", "sem", "email marketing", "crm", "customer relationship management", "erp",
    "enterprise resource planning", "supply chain management", "operations management",
    "human resources", "recruitment", "talent acquisition", "performance management",
    "compensation and benefits", "training and development", "employee relations"
]

# Design Skills
DESIGN_SKILLS = [
    "ui design", "ux design", "user interface", "user experience", "interaction design",
    "visual design", "graphic design", "web design", "mobile design", "responsive design",
    "wireframing", "prototyping", "mockups", "user research", "usability testing",
    "information architecture", "accessibility", "a11y", "typography", "color theory",
    "layout", "composition", "illustration", "animation", "motion graphics", "3d modeling",
    "photoshop", "illustrator", "indesign", "xd", "sketch", "figma", "invision", "zeplin",
    "principle", "after effects", "premiere pro", "final cut pro", "blender", "maya",
    "cinema 4d", "autocad", "revit", "sketchup", "solidworks", "fusion 360"
]

# Combine all skills
ALL_SKILLS = (
    PROGRAMMING_LANGUAGES + 
    WEB_TECHNOLOGIES + 
    DATA_SCIENCE + 
    CLOUD_DEVOPS + 
    DATABASE_TECHNOLOGIES + 
    MOBILE_DEVELOPMENT + 
    SOFT_SKILLS + 
    BUSINESS_SKILLS + 
    DESIGN_SKILLS
)

# Create a dictionary mapping skills to their categories
SKILL_CATEGORIES = {}
for skill in PROGRAMMING_LANGUAGES:
    SKILL_CATEGORIES[skill] = "Programming Languages"
for skill in WEB_TECHNOLOGIES:
    SKILL_CATEGORIES[skill] = "Web Technologies"
for skill in DATA_SCIENCE:
    SKILL_CATEGORIES[skill] = "Data Science & Analytics"
for skill in CLOUD_DEVOPS:
    SKILL_CATEGORIES[skill] = "Cloud & DevOps"
for skill in DATABASE_TECHNOLOGIES:
    SKILL_CATEGORIES[skill] = "Database Technologies"
for skill in MOBILE_DEVELOPMENT:
    SKILL_CATEGORIES[skill] = "Mobile Development"
for skill in SOFT_SKILLS:
    SKILL_CATEGORIES[skill] = "Soft Skills"
for skill in BUSINESS_SKILLS:
    SKILL_CATEGORIES[skill] = "Business Skills"
for skill in DESIGN_SKILLS:
    SKILL_CATEGORIES[skill] = "Design Skills"

# Common job titles by industry
JOB_TITLES = {
    "Technology": [
        "software engineer", "software developer", "web developer", "frontend developer", 
        "backend developer", "full stack developer", "mobile developer", "ios developer",
        "android developer", "devops engineer", "site reliability engineer", "cloud engineer",
        "data scientist", "data engineer", "machine learning engineer", "ai researcher",
        "data analyst", "business intelligence analyst", "database administrator", "dba",
        "systems administrator", "network engineer", "security engineer", "information security analyst",
        "qa engineer", "quality assurance engineer", "test engineer", "automation engineer",
        "product manager", "technical product manager", "project manager", "scrum master",
        "agile coach", "it manager", "cto", "chief technology officer", "vp of engineering",
        "director of engineering", "engineering manager", "technical lead", "tech lead",
        "solutions architect", "enterprise architect", "technical architect", "ui designer",
        "ux designer", "ui/ux designer", "graphic designer", "web designer"
    ],
    "Business": [
        "business analyst", "management consultant", "financial analyst", "investment banker",
        "accountant", "auditor", "tax specialist", "financial advisor", "financial planner",
        "investment analyst", "portfolio manager", "risk analyst", "compliance officer",
        "business development manager", "sales representative", "account executive", "sales manager",
        "marketing specialist", "marketing manager", "digital marketing manager", "seo specialist",
        "content marketer", "social media manager", "brand manager", "product marketing manager",
        "market research analyst", "public relations specialist", "communications manager",
        "human resources specialist", "hr manager", "recruiter", "talent acquisition specialist",
        "training and development specialist", "compensation analyst", "benefits administrator",
        "operations manager", "supply chain manager", "logistics coordinator", "procurement specialist",
        "office manager", "administrative assistant", "executive assistant", "customer service representative",
        "customer success manager", "client relationship manager"
    ],
    "Healthcare": [
        "physician", "doctor", "surgeon", "nurse", "registered nurse", "nurse practitioner",
        "physician assistant", "medical assistant", "pharmacist", "pharmacy technician",
        "dentist", "dental hygienist", "dental assistant", "veterinarian", "veterinary technician",
        "physical therapist", "occupational therapist", "speech therapist", "respiratory therapist",
        "radiologist", "radiology technician", "medical laboratory technician", "medical technologist",
        "phlebotomist", "paramedic", "emt", "emergency medical technician", "health information technician",
        "medical coder", "medical biller", "medical records specialist", "healthcare administrator",
        "hospital administrator", "clinical director", "nursing director", "medical director",
        "healthcare consultant", "public health specialist", "epidemiologist", "biostatistician",
        "clinical research associate", "clinical trial manager", "medical science liaison",
        "pharmaceutical sales representative", "medical device sales representative"
    ],
    "Education": [
        "teacher", "professor", "instructor", "tutor", "teaching assistant", "research assistant",
        "principal", "assistant principal", "dean", "superintendent", "education administrator",
        "curriculum developer", "instructional designer", "educational technologist", "school counselor",
        "academic advisor", "career counselor", "librarian", "library assistant", "special education teacher",
        "esl teacher", "early childhood educator", "preschool teacher", "kindergarten teacher",
        "elementary school teacher", "middle school teacher", "high school teacher", "college professor",
        "adjunct professor", "lecturer", "education consultant", "education policy analyst",
        "education researcher", "school psychologist", "speech-language pathologist", "school social worker"
    ]
}

# Flatten job titles list
ALL_JOB_TITLES = []
for industry_titles in JOB_TITLES.values():
    ALL_JOB_TITLES.extend(industry_titles)
