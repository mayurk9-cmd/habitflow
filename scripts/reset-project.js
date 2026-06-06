const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '..', 'app');
const indexFile = path.join(appDir, 'index.tsx');
const layoutFile = path.join(appDir, '_layout.tsx');

const indexContent = `import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text>Welcome to MyApp</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
`;

const layoutContent = `import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack />;
}
`;

fs.readdirSync(appDir).forEach((file) => {
  fs.rmSync(path.join(appDir, file), { recursive: true, force: true });
});

fs.writeFileSync(indexFile, indexContent);
fs.writeFileSync(layoutFile, layoutContent);

console.log('Project reset to blank state.');
