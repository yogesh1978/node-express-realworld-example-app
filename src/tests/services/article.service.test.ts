import prismaMock from '../prisma-mock';
import {
  deleteComment,
  favoriteArticle,
  getArticles,
  unfavoriteArticle,
} from '../../app/routes/article/article.service';

describe('ArticleService', () => {
  describe('deleteComment', () => {
    test('should throw an error ', () => {
      // Given
      const id = 123;
      const idUser = 456;

      // When
      // @ts-ignore
      prismaMock.comment.findFirst.mockResolvedValue(null);

      // Then
      expect(deleteComment(id, idUser)).rejects.toThrowError();
    });
  });

  describe('favoriteArticle', () => {
    test('should return the favorited article', async () => {
      // Given
      const slug = 'How-to-train-your-dragon';
      const username = 'RealWorld';

      const mockedUserResponse = {
        id: 123,
        username: 'RealWorld',
        email: 'realworld@me',
        password: '1234',
        bio: null,
        image: null,
        token: '',
        demo: false,
      };

      const mockedArticleResponse = {
        id: 123,
        slug: 'How-to-train-your-dragon',
        title: 'How to train your dragon',
        description: '',
        body: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
        tagList: [],
        favoritedBy: [],
        author: {
          username: 'RealWorld',
          bio: null,
          image: null,
          followedBy: [],
        },
      };

      // When
      // @ts-ignore
      prismaMock.user.findUnique.mockResolvedValue(mockedUserResponse);
      // @ts-ignore
      prismaMock.article.update.mockResolvedValue(mockedArticleResponse);

      // Then
      await expect(favoriteArticle(slug, mockedUserResponse.id)).resolves.toHaveProperty(
        'favoritesCount',
      );
    });

    test('should throw an error if no user is found', async () => {
      // Given
      const id = 123;
      const slug = 'how-to-train-your-dragon';
      const username = 'RealWorld';

      // When
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Then
      await expect(favoriteArticle(slug, id)).rejects.toThrowError();
    });
  });
  describe('unfavoriteArticle', () => {
    test('should return the unfavorited article', async () => {
      // Given
      const slug = 'How-to-train-your-dragon';
      const username = 'RealWorld';

      const mockedUserResponse = {
        id: 123,
        username: 'RealWorld',
        email: 'realworld@me',
        password: '1234',
        bio: null,
        image: null,
        token: '',
        demo: false,
      };

      const mockedArticleResponse = {
        id: 123,
        slug: 'How-to-train-your-dragon',
        title: 'How to train your dragon',
        description: '',
        body: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
        tagList: [],
        favoritedBy: [],
        author: {
          username: 'RealWorld',
          bio: null,
          image: null,
          followedBy: [],
        },
      };

      // When
      prismaMock.user.findUnique.mockResolvedValue(mockedUserResponse);
      prismaMock.article.update.mockResolvedValue(mockedArticleResponse);

      // Then
      await expect(unfavoriteArticle(slug, mockedUserResponse.id)).resolves.toHaveProperty(
        'favoritesCount',
      );
    });

    test('should throw an error if no user is found', async () => {
      // Given
      const id = 123;
      const slug = 'how-to-train-your-dragon';
      const username = 'RealWorld';

      // When
      prismaMock.user.findUnique.mockResolvedValue(null);

      // Then
      await expect(unfavoriteArticle(slug, id)).rejects.toThrowError();
    });
  });

  describe('getArticles', () => {
    describe('tag filter', () => {
      // Helper factory to build mock articles
      const buildMockArticle = (slug: string, tags: string[]) => ({
        id: 123,
        slug,
        title: 'How to train your dragon',
        description: 'The best article',
        body: 'Article body',
        createdAt: new Date(),
        updatedAt: new Date(),
        authorId: 456,
        tagList: tags.map((name) => ({ name })),
        favoritedBy: [],
        author: {
          username: 'RealWorld',
          bio: null,
          image: null,
          followedBy: [],
        },
        _count: {
          favoritedBy: 0,
        },
      });

      test('AC1: should match tags case-insensitively with Dragons query', async () => {
        // Given
        const query = { tag: 'Dragons' };
        const mockArticle = buildMockArticle('how-to-train-dragons', ['dragons']);

        // When
        // @ts-ignore
        prismaMock.article.count.mockResolvedValue(1);
        // @ts-ignore
        prismaMock.article.findMany.mockResolvedValue([mockArticle]);

        // Then
        const result = await getArticles(query);

        // Verify the query contains the insensitive condition
        expect(prismaMock.article.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              AND: expect.arrayContaining([
                {
                  tagList: {
                    some: {
                      name: {
                        equals: 'Dragons',
                        mode: 'insensitive',
                      },
                    },
                  },
                },
              ]),
            },
          }),
        );

        // Verify the result
        expect(result.articles).toHaveLength(1);
        expect(result.articles[0].tagList).toEqual(['dragons']);
        expect(result.articlesCount).toBe(1);
      });

      test('AC2: should return same results for different casings (dragons, Dragons, DRAGONS)', async () => {
        // Given
        const mockArticle = buildMockArticle('how-to-train-dragons', ['dragons']);
        const casings = ['dragons', 'Dragons', 'DRAGONS'];

        // When
        // @ts-ignore
        prismaMock.article.count.mockResolvedValue(1);
        // @ts-ignore
        prismaMock.article.findMany.mockResolvedValue([mockArticle]);

        // Then
        const results = await Promise.all(
          casings.map((tag) => getArticles({ tag })),
        );

        // All results should be equal
        expect(results[0]).toEqual(results[1]);
        expect(results[1]).toEqual(results[2]);

        // Verify each call used the insensitive mode
        expect(prismaMock.article.findMany).toHaveBeenCalledTimes(3);
        casings.forEach((casing) => {
          expect(prismaMock.article.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: {
                AND: expect.arrayContaining([
                  {
                    tagList: {
                      some: {
                        name: {
                          equals: casing,
                          mode: 'insensitive',
                        },
                      },
                    },
                  },
                ]),
              },
            }),
          );
        });
      });

      test('AC3: should return both Dragons and dragons as separate articles without duplicates', async () => {
        // Given
        const query = { tag: 'dragons' };
        const article1 = buildMockArticle('article-1', ['Dragons']);
        const article2 = buildMockArticle('article-2', ['dragons']);

        // When
        // @ts-ignore
        prismaMock.article.count.mockResolvedValue(2);
        // @ts-ignore
        prismaMock.article.findMany.mockResolvedValue([article1, article2]);

        // Then
        const result = await getArticles(query);

        // Verify the query does not use distinct
        expect(prismaMock.article.findMany).toHaveBeenCalledWith(
          expect.not.objectContaining({
            distinct: expect.anything(),
          }),
        );

        // Verify results
        expect(result.articles).toHaveLength(2);
        expect(result.articles[0].slug).toBe('article-1');
        expect(result.articles[1].slug).toBe('article-2');
        expect(result.articlesCount).toBe(2);
      });

      test('AC4: should return empty list with 200 for unknown tag UNICORNS', async () => {
        // Given
        const query = { tag: 'UNICORNS' };

        // When
        // @ts-ignore
        prismaMock.article.count.mockResolvedValue(0);
        // @ts-ignore
        prismaMock.article.findMany.mockResolvedValue([]);

        // Then
        const result = await getArticles(query);

        expect(result.articles).toEqual([]);
        expect(result.articlesCount).toBe(0);
      });

      test('should not apply case-insensitive mode to author filter', async () => {
        // Given
        const query = { author: 'RealWorld' };
        const mockArticle = buildMockArticle('article-1', []);

        // When
        // @ts-ignore
        prismaMock.article.count.mockResolvedValue(1);
        // @ts-ignore
        prismaMock.article.findMany.mockResolvedValue([mockArticle]);

        // Then
        await getArticles(query);

        // Verify author condition does not have mode: 'insensitive'
        expect(prismaMock.article.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              AND: expect.arrayContaining([
                expect.objectContaining({
                  author: expect.objectContaining({
                    AND: expect.arrayContaining([
                      {
                        username: {
                          equals: 'RealWorld',
                        },
                      },
                    ]),
                  }),
                }),
              ]),
            },
          }),
        );
      });
    });
  });
});
