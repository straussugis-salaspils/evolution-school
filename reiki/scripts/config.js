const basePathNavigator = [
  {
    number: "01",
    title: "Рейки I",
    subtitle: "Первая ступень",
    description: "",
    status: "current",
    href: "index.html"
  },
  {
    number: "02",
    title: "Рейки II",
    subtitle: "Вторая ступень",
    description: "",
    status: "future",
    href: "reiki-2.html"
  },
  {
    number: "03",
    title: "Мастер Жизни",
    subtitle: "Третий уровень",
    description: "",
    status: "future",
    href: "master-life.html"
  },
  {
    number: "04",
    title: "Мастер-Учитель Рейки",
    subtitle: "Четвёртый уровень",
    description: "",
    status: "future",
    href: "master-teacher.html"
  },
  {
    number: "05",
    title: "Многомерный Мастер",
    subtitle: "Пятый уровень",
    description: "",
    status: "future",
    href: "multidimensional-master.html"
  },
  {
    number: "06",
    title: "Метод Рейки",
    subtitle: "Метод и традиция",
    description: "",
    status: "future",
    href: "method.html"
  }
];

const pathNavigatorOrder = ["method.html", "index.html", "reiki-2.html", "master-life.html", "master-teacher.html", "multidimensional-master.html"];
const orderedPathNavigator = pathNavigatorOrder
  .map((href, index) => {
    const item = basePathNavigator.find((step) => step.href === href);
    return item ? { ...item, number: String(index + 1).padStart(2, "0"), status: "future" } : null;
  })
  .filter(Boolean);

function orderedNavigatorFor(currentHref) {
  return orderedPathNavigator.map((step) => ({
    ...step,
    status: step.href === currentHref ? "current" : "foundation",
  }));
}

const siteConfig = {
  paymentUrl: "",
  questionUrl: "https://t.me/+vXXRUnvbYBFkYzRi",
  reiki2PaymentUrl: "",
  reiki2QuestionUrl: "https://t.me/+vXXRUnvbYBFkYzRi",
  masterLifeApplicationUrl: "https://t.me/SvetlanaStrauss",
  masterLifeQuestionUrl: "https://t.me/SvetlanaStrauss",
  masterTeacherApplicationUrl: "https://t.me/SvetlanaStrauss",
  masterTeacherQuestionUrl: "https://t.me/SvetlanaStrauss",
  multidimensionalMasterApplicationUrl: "https://t.me/SvetlanaStrauss",
  multidimensionalMasterQuestionUrl: "https://t.me/SvetlanaStrauss",
  previewMode: true,
  testimonials: [],
  ctaAliases: {
    payment: "paymentUrl",
    question: "questionUrl",
    paymentReiki2: "reiki2PaymentUrl",
    questionReiki2: "reiki2QuestionUrl",
    applicationMasterLife: "masterLifeApplicationUrl",
    questionMasterLife: "masterLifeQuestionUrl",
    applicationMasterTeacher: "masterTeacherApplicationUrl",
    questionMasterTeacher: "masterTeacherQuestionUrl",
    applicationMultidimensionalMaster: "multidimensionalMasterApplicationUrl",
    questionMultidimensionalMaster: "multidimensionalMasterQuestionUrl"
  },
  pathNavigator: orderedNavigatorFor("index.html"),
  pathNavigatorByLevel: {
    "reiki-1": orderedNavigatorFor("index.html"),
    "reiki-2": orderedNavigatorFor("reiki-2.html"),
    "master-life": orderedNavigatorFor("master-life.html"),
    "master-teacher": orderedNavigatorFor("master-teacher.html"),
    "multidimensional-master": orderedNavigatorFor("multidimensional-master.html"),
    "reiki-method": orderedNavigatorFor("method.html"),
  }
};

window.siteConfig = siteConfig;
