const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

const filesToProcess = [
    'Activity.jsx',
    'Alerts.jsx',
    'ChannelDetails.jsx',
    'Home.jsx',
    'Profile.jsx',
    'Search.jsx',
    'Settings.jsx',
    'StreamDetails.jsx',
    'Upload.jsx'
];

filesToProcess.forEach(file => {
    const filePath = path.join(pagesDir, file);
    if (!fs.existsSync(filePath)) return;

    let content = fs.readFileSync(filePath, 'utf-8');

    // Remove imports for Header and Navigation
    content = content.replace(/import\s+{\s*Header\s*}\s+from\s+["']\.\.\/components\/header["'];?\n?/g, '');
    content = content.replace(/import\s+{\s*Navigation\s*}\s+from\s+["']\.\.\/components\/navigation["'];?\n?/g, '');

    // Also handle exact sibling imports if they were somehow used
    content = content.replace(/import\s+{\s*Header\s*}\s+from\s+["']\.\/components\/header["'];?\n?/g, '');
    content = content.replace(/import\s+{\s*Navigation\s*}\s+from\s+["']\.\/components\/navigation["'];?\n?/g, '');

    if (file === 'Home.jsx') {
        // Custom logic for Home to preserve the relative wrapper
        content = content.replace(/<div className="flex flex-col h-\[100dvh\] bg-background">\s*<Header \/>/g, '<div className="flex-1 w-full h-full relative">');
        content = content.replace(/<Navigation \/>\s*<\/div>/g, '</div>');
    } else if (file === 'Profile.jsx') {
        // Custom logic for Profile
        content = content.replace(/<div className="flex flex-col h-screen bg-background">\s*<Header \/>/g, '<div className="flex-1 w-full h-full flex overflow-hidden">');
        // Remove the mobile nav wrapper at the bottom
        content = content.replace(/{\/\* Mobile nav for extremely small screens - hide on md\+ as sidebar handles it \*\/}\s*<div className="md:hidden">\s*<Navigation \/>\s*<\/div>\s*<\/div>/g, '</div>');
        // Remove the old <main> wrapper to avoid double flex
        content = content.replace(/<main className="flex-1 flex overflow-hidden">/g, '');
        content = content.replace(/<\/main>\s*<\/div>/g, '</div>');
    } else {
        // Standard pages logic
        content = content.replace(/<div className="flex flex-col h-screen bg-background">\s*<Header \/>\s*<main className="flex-1 overflow-y-auto px-4 md:px-6 py-8">/g, '<div className="flex-1 overflow-y-auto px-4 md:px-6 py-8 w-full h-full">');
        content = content.replace(/<\/main>\s*<Navigation \/>\s*<\/div>/g, '</div>');
    }

    // Remove <Header /> and <Navigation /> if they somehow slipped through
    content = content.replace(/<Header \/>\n?/g, '');
    content = content.replace(/<Navigation \/>\n?/g, '');
    content = content.replace(/<div className="md:hidden">\s*<Navigation \/>\s*<\/div>\n?/g, '');

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Processed:', file);
});
