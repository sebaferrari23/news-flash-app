import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export const BookmarksScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>Bookmarks</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
