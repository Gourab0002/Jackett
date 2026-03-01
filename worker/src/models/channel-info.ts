export interface ChannelInfo {
  title: string;
  description: string;
  link: string;
  language: string;
  category: string;
}

export function createChannelInfo(partial?: Partial<ChannelInfo>): ChannelInfo {
  return {
    title: '',
    description: '',
    link: '',
    language: 'en-US',
    category: 'search',
    ...partial,
  };
}
