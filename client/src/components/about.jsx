import { Typography, Box, Container, Avatar, Stack, IconButton, Grid, Paper } from "@mui/material";
import Iconify from "./Iconify";
import gravatarUrl from 'gravatar-url';

const About = () => {
  // Developer Info
  const developer = {
    name: "Ashish Goyal",
    email: "goyalashish809@gmail.com",
    github: "https://github.com/ashish-goyal-1",
    linkedin: "https://www.linkedin.com/in/ashish-goyal-66422b257/",
    repoUrl: "https://github.com/ashish-goyal-1/SplitBill"
  };

  const frontendStack = [
    { name: "React", icon: "logos:react", desc: "Component-based UI" },
    { name: "Material UI", icon: "logos:material-ui", desc: "UI components & theming" },
    { name: "Chart.js", icon: "simple-icons:chartdotjs", desc: "Visual analytics charts" },
    { name: "Formik + Yup", icon: "mdi:form-textbox", desc: "Forms and validation" },
    { name: "Axios", icon: "mdi:api", desc: "API calls" },
  ];

  const backendStack = [
    { name: "Node.js", icon: "logos:nodejs-icon", desc: "Server runtime" },
    { name: "Express.js", icon: "skill-icons:expressjs-dark", desc: "REST API framework" },
    { name: "Mongoose", icon: "logos:mongodb-icon", desc: "MongoDB ODM" },
    { name: "JWT", icon: "mdi:shield-key", desc: "Authentication mechanism" },
    { name: "bcrypt.js", icon: "mdi:lock", desc: "Password encryption" },
    { name: "Nodemailer", icon: "mdi:email-fast", desc: "Email service" },
    { name: "node-cron", icon: "mdi:clock-outline", desc: "Scheduled tasks" },
  ];

  const databaseStack = [
    { name: "MongoDB Atlas", icon: "logos:mongodb-icon", desc: "Cloud NoSQL database" },
  ];

  const features = [
    { icon: "mdi:account-group", title: "Group Expenses", desc: "Create and manage groups, add members, and split expenses automatically" },
    { icon: "mdi:swap-horizontal", title: "Smart Split Algorithm", desc: "Minimizes total transactions using optimized debt logic" },
    { icon: "mdi:refresh", title: "Recurring Expenses", desc: "Set expenses to repeat daily, weekly, monthly, or yearly" },
    { icon: "mdi:file-export", title: "PDF & CSV Export", desc: "Download full group reports in clean PDF or spreadsheet format" },
    { icon: "mdi:chart-line", title: "Smart Analytics", desc: "Visual charts: monthly spending, category breakdown, and daily trends" },
    { icon: "mdi:bell-ring", title: "Real-Time Notifications", desc: "In-app alerts with unread count, auto-refresh, and group navigation" },
    { icon: "mdi:email-fast", title: "Email Reminders", desc: "Manual and scheduled emails for unsettled balances and confirmations" },
    { icon: "mdi:theme-light-dark", title: "Dark Mode", desc: "Toggle between light and dark themes, persisted across sessions" },
    { icon: "mdi:cellphone", title: "PWA Ready", desc: "Install as a mobile app with custom icons and offline support" },
  ];

  const TechSection = ({ title, items }) => (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>
        {title}
      </Typography>
      <Grid container spacing={2}>
        {items.map((tech) => (
          <Grid item xs={12} sm={6} key={tech.name}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Iconify icon={tech.icon} width={24} />
              <Box>
                <Typography variant="body2" fontWeight={600}>{tech.name}</Typography>
                <Typography variant="caption" color="text.secondary">{tech.desc}</Typography>
              </Box>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      {/* Hero Section */}
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 3,
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.primary.light}25 100%)`,
          textAlign: 'center'
        }}
      >
        <Typography variant="h3" fontWeight={700} gutterBottom>
          💰 SplitBill
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Smart Group Expense Splitting Application
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mt: 2 }}>
          A full-stack MERN application that makes splitting expenses with friends easy.
          Track shared expenses, settle balances, and get insights into your spending patterns.
        </Typography>

        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
          <IconButton
            component="a"
            href={developer.repoUrl}
            target="_blank"
            sx={{ bgcolor: 'background.paper', boxShadow: 2 }}
          >
            <Iconify icon="mdi:github" width={28} />
          </IconButton>
        </Stack>
      </Paper>

      {/* Tech Stack */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          🛠️ Tech Stack
        </Typography>
        <Box sx={{ mt: 2 }}>
          <TechSection title="🚀 Frontend" items={frontendStack} />
          <TechSection title="⚙️ Backend" items={backendStack} />
          <TechSection title="☁️ Database" items={databaseStack} />
        </Box>
      </Paper>

      {/* Features */}
      <Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          ✨ Key Features
        </Typography>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {features.map((feature) => (
            <Grid item xs={12} sm={6} key={feature.title}>
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: 'primary.lighter',
                    color: 'primary.main'
                  }}
                >
                  <Iconify icon={feature.icon} width={24} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.desc}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Developer Section */}
      <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={600} gutterBottom>
          👨‍💻 Developer
        </Typography>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={3}
          alignItems="center"
          sx={{ mt: 3 }}
        >
          <Avatar
            src={gravatarUrl(developer.email, { size: 200, default: 'mp' })}
            sx={{ width: 100, height: 100, boxShadow: 3 }}
          />
          <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
            <Typography variant="h5" fontWeight={600}>
              {developer.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Full Stack Developer
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mt: 2 }} justifyContent={{ xs: 'center', sm: 'flex-start' }}>
              <IconButton
                component="a"
                href={developer.linkedin}
                target="_blank"
                sx={{ bgcolor: '#0077B5', color: 'white', '&:hover': { bgcolor: '#005885' } }}
                size="small"
              >
                <Iconify icon="mdi:linkedin" width={20} />
              </IconButton>
              <IconButton
                component="a"
                href={developer.github}
                target="_blank"
                sx={{ bgcolor: '#333', color: 'white', '&:hover': { bgcolor: '#111' } }}
                size="small"
              >
                <Iconify icon="mdi:github" width={20} />
              </IconButton>
              <IconButton
                component="a"
                href={`mailto:${developer.email}`}
                sx={{ bgcolor: '#EA4335', color: 'white', '&:hover': { bgcolor: '#C5221F' } }}
                size="small"
              >
                <Iconify icon="mdi:email" width={20} />
              </IconButton>
            </Stack>
          </Box>
        </Stack>
      </Paper>

      {/* Footer */}
      <Box sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
        <Typography variant="body2">
          Built with ❤️ using MERN Stack
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          © {new Date().getFullYear()} {developer.name}. All rights reserved.
        </Typography>
      </Box>
    </Container>
  );
};

export default About;