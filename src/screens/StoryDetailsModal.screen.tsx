import * as React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export const StoryDetailsModal: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>StoryDetails</Text>
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
