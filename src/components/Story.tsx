import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import {
  StorySummaryFieldsFragment,
  AddBookmarkMutation,
  AddBookmarkMutationVariables,
  RemoveBookmarkMutation,
  RemoveBookmarkMutationVariables,
} from '../graphql/__generated__/operationTypes';
import { gql, useMutation } from 'urql';
import { StorySummaryFields } from '../graphql/fragments';

const ADD_BOOKMARK_MUTATION = gql`
  mutation AddBookmark($storyId: ID!) {
    addBookmark(storyId: $storyId) {
      id
      story {
        ...StorySummaryFields
      }
    }
  }
  ${StorySummaryFields}
`;

const REMOVE_BOOKMARK_MUTATION = gql`
  mutation RemoveBookmark($bookmarkId: ID!) {
    removeBookmark(bookmarkId: $bookmarkId)
  }
`;

export const Story: React.FC<{
  item: StorySummaryFieldsFragment;
  cta: 'add' | 'remove';
}> = ({ item, cta }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [{ fetching: isAddingBookmark }, addBookmark] = useMutation<
    AddBookmarkMutation,
    AddBookmarkMutationVariables
  >(ADD_BOOKMARK_MUTATION);

  const [{ fetching: isRemovingBookmark }, removeBookmark] = useMutation<
    RemoveBookmarkMutation,
    RemoveBookmarkMutationVariables
  >(REMOVE_BOOKMARK_MUTATION);

  return (
    <Pressable
      onPress={() =>
        navigation.navigate('StoryDetailsModal', {
          id: item.id,
          title: item.title,
        })
      }>
      <View style={styles.row}>
        <Text style={styles.title}>
          {item.title} {item.bookmarkId ? '🔖' : ''}
        </Text>
        {!item.bookmarkId && !isAddingBookmark && cta === 'add' ? (
          <Pressable onPress={() => addBookmark({ storyId: item.id })}>
            <Text>Add Bookmark</Text>
          </Pressable>
        ) : null}
        {item.bookmarkId && !isRemovingBookmark && cta === 'remove' ? (
          <Pressable
            onPress={() => removeBookmark({ bookmarkId: item.bookmarkId })}>
            <Text>Remove Bookmark</Text>
          </Pressable>
        ) : null}
        {isAddingBookmark || isRemovingBookmark ? <ActivityIndicator /> : null}
      </View>
      <Text style={styles.summary}>{item.summary}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '400',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  summary: {
    fontSize: 18,
    color: 'grey',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
});
