import type { Module, dashData as DashData, flow as Flow, sectors as Sectors, onboarding as Onboarding, azmFaq as AzmFaq } from "../azm";

export const modules: Module[] = [
  { key: "sales", title: "Sales & Orders", latin: "Sales & Orders", desc: "Online store and point-of-sale orders on one screen, from fulfillment to delivery.", points: ["Invoices and quotes", "Order and delivery status", "Returns and exchanges"] },
  { key: "inventory", title: "Inventory", latin: "Inventory", desc: "Products, warehouses, and branches — with early alerts before anything runs out.", points: ["Multi-warehouse", "Stock counts and adjustments", "Low-stock alerts"] },
  { key: "customers", title: "Customers", latin: "Customers", desc: "A complete history of every customer's purchases and interactions, plus targeted offers for loyal buyers.", points: ["Unified customer profile", "Segments and loyalty", "Follow-ups and reminders"] },
  { key: "finance", title: "Finance", latin: "Finance", desc: "Revenue, expenses, and accounts — linked automatically to every sale and purchase.", points: ["Automatic journal entries", "Expenses and approvals", "Profit reports"] },
  { key: "hr", title: "Human Resources", latin: "HR", desc: "Employees, attendance, payroll, and permissions for everyone on your team.", points: ["Time and attendance", "Payroll runs", "Roles and permissions"] },
  { key: "reports", title: "Smart Reports", latin: "Smart Reports", desc: "Real-time dashboards and reports that answer your questions before you ask them.", points: ["Best sellers", "Profit margins", "Channel and branch performance"] },
];

export const dashData: typeof DashData = [
  { t: "Sales & Orders", c: "Sales this week", k: [["Orders today", "86"], ["Sales today", "$4,320"], ["Avg. basket", "$50"]], b: [42, 58, 51, 70, 64, 88, 76], l: [["Order #2381", "Shipped"], ["Order #2382", "Processing"], ["Order #2383", "Awaiting payment", "r"], ["Order #2384", "Delivered"]] },
  { t: "Inventory", c: "Stock movement", k: [["Products", "1,240"], ["Low stock", "18"], ["Value", "$62K"]], b: [70, 64, 58, 66, 52, 48, 60], l: [["Royal Oud", "Low", "r"], ["White Musk", "In stock"], ["Gift Set", "New arrival"], ["Luxury Amber", "Sold out", "r"]] },
  { t: "Customers", c: "New customers per day", k: [["Customers", "3,560"], ["New", "142"], ["Returning", "38%"]], b: [22, 30, 26, 41, 35, 48, 44], l: [["Ahmed Al-Hakimi", "5 orders"], ["Sara Al-Qudsi", "Loyal customer"], ["Mohammed Al-Oraiqi", "Abandoned cart", "r"], ["Noor Al-Ahdal", "New order"]] },
  { t: "Finance", c: "Revenue & expenses", k: [["Revenue", "$184K"], ["Expenses", "$96K"], ["Profit", "$88K"]], b: [55, 70, 45, 80, 60, 90, 72], l: [["Invoice #1042", "Paid"], ["Invoice #1043", "Overdue", "r"], ["Shipping costs", "Approved"], ["Supplier transfer", "Today"]] },
  { t: "Human Resources", c: "Attendance rate", k: [["Employees", "24"], ["Attendance", "96%"], ["On leave", "2"]], b: [88, 92, 90, 95, 93, 97, 96], l: [["Leave — Reem", "Pending", "r"], ["October payroll", "Ready"], ["Employee access", "Done"], ["Quarterly review", "Done"]] },
  { t: "Smart Reports", c: "Monthly sales growth", k: [["Growth", "+18%"], ["Profit margin", "31%"], ["Top channel", "Online store"]], b: [30, 38, 44, 52, 61, 70, 82], l: [["Best sellers", "Report"], ["Store performance", "Weekly"], ["Slow-moving stock", "Ready"], ["Taxes", "Due", "r"]] },
];

export const flow: typeof Flow = [
  { title: "New order", desc: "Comes in from the online store or point of sale" },
  { title: "Inventory", desc: "Stock is deducted and branches update instantly" },
  { title: "Finance", desc: "The journal entry and invoice are recorded automatically" },
  { title: "Customer", desc: "The order is added to their profile and history" },
  { title: "Reports", desc: "KPIs update in real time" },
];

export const sectors: typeof Sectors = [
  { title: "Retail", desc: "Online store, point of sale, and inventory in one system." },
  { title: "Import & Wholesale", desc: "Multiple warehouses, distributors, and tiered pricing by customer type." },
  { title: "Service Companies", desc: "Clients, contracts, invoices, and teams with clear permissions." },
  { title: "Multi-Branch Businesses", desc: "One unified view of every branch, with reports for each." },
];

export const onboarding: typeof Onboarding = [
  { title: "Guided demo", desc: "A session where we learn how you work and show you the system on data close to your own." },
  { title: "Setup & data migration", desc: "We configure the modules you need and move your products and customers over from your current spreadsheets." },
  { title: "Training & go-live", desc: "We train your team and stay with you through the first weeks until the system runs with confidence." },
];

export const azmFaq: typeof AzmFaq = [
  { q: "Does AzmSmart work with my existing online store?", a: "It's built to connect directly to your online store, so orders flow into inventory and finance with no manual entry. We'll review your current store with you during the demo." },
  { q: "Do I need to use every module from day one?", a: "No. Start with the modules you need today and add more as your business grows." },
  { q: "Can I use it on my phone?", a: "Yes. The interface is fully responsive and runs in any browser on any device — and with the AZM app, your KPIs are always in your pocket." },
  { q: "How do I know which pricing fits my company?", a: "Pricing depends on your modules, number of users, and branches. Book a demo and we'll follow up with a detailed proposal." },
];
