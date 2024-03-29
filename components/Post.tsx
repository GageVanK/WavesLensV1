import React, { useMemo, useState } from "react";
import formatDate from "@/lib/formatDate";
import Link from "next/link";
import {
  useCreateMirror,
  useReactionToggle,
  Post,
  Comment,
  PublicationReactionType,
  useSession,
  useBookmarkToggle,
  Quote,
  Mirror,
  AnyPublication,
  PrimaryPublication,
  useNotInterestedToggle,
  useReportPublication,
  ReportReason,
  useWhoReactedToPublication,
  useHidePublication
} from "@lens-protocol/react-web";
import { useRouter } from "next/router";
import {
  Paper,
  ActionIcon,
  Group,
  Tooltip,
  Avatar,
  Space,
  UnstyledButton,
  Text,
  Container,
  Spoiler,
  Image,
  Center,
  Button,
  HoverCard,
  Modal,
  Menu,
  rem,
  Select
} from "@mantine/core";
import {
  IconCheck,
  IconHeart,
  IconHeartFilled,
  IconMessageCircle,
  IconMessageShare,
  IconScriptMinus,
  IconScriptPlus,
  IconStack3,
  IconX,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { GiMirrorMirror } from "react-icons/gi";
import { Player } from "@livepeer/react";
import { IconExclamationMark } from "@tabler/icons-react";
import { FaComments, FaArrowUpRightFromSquare } from "react-icons/fa6";
import { AudioPlayer } from 'react-audio-play';
import { FaHeartBroken } from "react-icons/fa";
import { useHover, useDisclosure } from '@mantine/hooks';
import { BsThreeDotsVertical } from "react-icons/bs";
import { IoBookmarkOutline } from "react-icons/io5";
import { IoBookmark } from "react-icons/io5";
import { IoTrashBin } from "react-icons/io5";

import { MdHideImage, MdReport } from "react-icons/md";
import { BiHide, BiSolidHide  } from "react-icons/bi";
import { LuArrowUpRightSquare } from "react-icons/lu";

type Props = {
  post: Post | Comment | Quote | Mirror;
};

function isMirrorPost(post: Post | Comment | Quote | Mirror): post is Mirror {
  return post.__typename === "Mirror" && "mirrorOn" in post;
}

export default function Post({ post }: Props) {
  const router = useRouter();
  const { execute: react, error } = useReactionToggle();
  const { data: session } = useSession();
  const { hovered, ref } = useHover();
  const { execute: toggle, error: bookmarkError } = useBookmarkToggle();
  const { execute: toggleNotInterested, error: NiError } = useNotInterestedToggle();
  const [reportType, setReportType] = useState<string | null>('');
  const [opened, { open, close }] = useDisclosure(false);
  const { execute: hide, loading, error: HideError } = useHidePublication();
  // Either use the post, or if it has been decrypted, use the decrypted post
  const postToUse = useMemo(() => {
    return post;
  }, [post]);

  //handling reposts
  const isMirror = isMirrorPost(post);
  const postContent = isMirror ? post.mirrorOn : post;

  const { execute: mirror } = useCreateMirror();
  async function handleMirror() {
    if (!session) return;
    await mirror({
      mirrorOn: postToUse.id, // the publication ID to mirror
    });
  }

  const replaceURLs = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const atSymbolRegex = /(\S*@+\S*)/g;

    return text
      .replace(
        urlRegex,
        (url: any) => `<a href="${url}" target="_blank">${url}</a>`,
      )
      .replace(atSymbolRegex, (match: any) => ` ${match} `);
  };


  return (
    <>

      <Paper p="xs" shadow="xl" radius="md" withBorder>
        <Space h="sm" />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Group ml={10} justify="left">
            <Text c="dimmed" size="xs" fw={500}>
              {formatDate(postToUse.createdAt)} ago
            </Text>
          </Group>

          <Group justify="right">
            {isMirror && (
              <Button
                variant="transparent"
                leftSection={<GiMirrorMirror size={13} />}
                component={Link}
                href={`/wave/${postToUse.by?.handle?.localName}`}
              >
                <Text c="dimmed" size="xs">
                  {postToUse.by.handle?.localName} mirrored
                </Text>
              </Button>
            )}

            {postToUse.__typename === "Comment" && (
              <Button
                variant="transparent"
                leftSection={<IconMessageCircle size={13} />}
                component={Link}
                href={`/post/${postToUse.commentOn?.id}`}
              >
                <Text c="dimmed" size="xs">
                  {postToUse.by.handle?.localName} Commented
                </Text>
              </Button>
            )}

            {postToUse.__typename === "Quote" && (
              <Button
                variant="transparent"
                leftSection={<FaComments size={13} />}
                component={Link}
                href={`/post/${postToUse.quoteOn?.id}`}
              >
                <Text c="dimmed" size="xs">
                {postToUse.by.handle?.localName} Quoted
                </Text>
              </Button>
            )}
             <Menu shadow="md">
              <Menu.Target>
                    <ActionIcon size="xs" variant="transparent">
                    <BsThreeDotsVertical />
                    </ActionIcon>
                    </Menu.Target>

                      <Menu.Dropdown >

                           <Menu.Item onClick={() => {
                    
                            router.push(`/post/${post.id}`);
                            }} 
                    leftSection={<LuArrowUpRightSquare style={{ width: rem(17), height: rem(17) }} />}>
                    Visit Post
                  </Menu.Item>
               { // @ts-ignore
               postToUse?.operations?.hasBookmarked ? (
                  <Menu.Item onClick={() => {
                    toggle({publication: postToUse as AnyPublication}); 
                    if (!bookmarkError) {
                    notifications.show({
                      title: "Success",
                      icon: <IconCheck size="1.1rem" />,
                      color: "green",
                      message: "Bookmark successfully removed!",
                    }); 
                  } else {
                    notifications.show({
                      title: "Error",
                      icon: <IconX size="1.1rem" />,
                      color: "red",
                      message: "Something Happened",
                    }); 

                    }
                  
                  
                  }} 
                    leftSection={<IoBookmark style={{ width: rem(17), height: rem(17)  }} />}>
                    Remove Bookmark
                  </Menu.Item>
               ):(
                  <Menu.Item onClick={() => {
                    toggle({publication: postToUse as AnyPublication})
                  if (!bookmarkError) {
                    notifications.show({
                      title: "Success",
                      icon: <IconCheck size="1.1rem" />,
                      color: "green",
                      message: "Successfully Bookmarked! View on your Dashboard.",
                    }); 
                  } else {
                    notifications.show({
                      title: "Error",
                      icon: <IconX size="1.1rem" />,
                      color: "red",
                      message: "Something Happened",
                    }); 

                    }
                }} 
                  leftSection={<IoBookmarkOutline style={{ width: rem(17), height: rem(17)  }} />}>
                    Bookmark
                  </Menu.Item>
               )}
             
                { // @ts-ignore
               postToUse?.operations?.isNotInterested ? (
                  <Menu.Item onClick={() => {
                    toggleNotInterested({publication: postToUse as AnyPublication})
                    if (!NiError) {
                    notifications.show({
                      title: "Success",
                      icon: <IconCheck size="1.1rem" />,
                      color: "green",
                      message: "Successfully undone!",
                    }); 
                  } else {
                    notifications.show({
                      title: "Error",
                      icon: <IconX size="1.1rem" />,
                      color: "red",
                      message: "Something Happened!",
                    }); 

                    }
                  }} 
                  leftSection={<BiSolidHide  style={{ width: rem(17), height: rem(17)  }} />}>
                    Undo
                  </Menu.Item>
               ):(
                  <Menu.Item onClick={() => {
                    toggleNotInterested({publication: postToUse as AnyPublication})
                     if (!NiError) {
                    notifications.show({
                      title: "Success",
                      icon: <IconCheck size="1.1rem" />,
                      color: "green",
                      message: "Not Interested!",
                    }); 
                  } else {
                    notifications.show({
                      title: "Error",
                      icon: <IconX size="1.1rem" />,
                      color: "red",
                      message: "Something Happened!",
                    }); 

                    }
                  }} 
                  leftSection={<BiHide style={{ width: rem(17), height: rem(17)  }} />}>
                    Not Interested
                  </Menu.Item>
               )}
               {session?.authenticated && session?.type === "WITH_PROFILE" && session.profile?.handle?.localName === postContent.by?.handle?.localName && (
                <>
                  <Menu.Divider />
                  <Menu.Item onClick={() => {
                    hide({publication: postToUse as AnyPublication})
                    if (!HideError) {
                      notifications.show({
                        title: "Success",
                        icon: <IconCheck size="1.1rem" />,
                        color: "green",
                        message: "Post Deleted!",
                      }); 
                    } else {
                    notifications.show({
                      title: "Error",
                      icon: <IconX size="1.1rem" />,
                      color: "red",
                      message: "Something Happened!",
                    }); 

                    }
                  }} 
                  color="red"
                  leftSection={<IoTrashBin style={{ width: rem(17), height: rem(17)  }} />}
                  
                  >
                    Delete
                  </Menu.Item>

                </>
               )}

              </Menu.Dropdown>

              
            </Menu>
          </Group>
        </div>

        <Space h="xl" />
        <HoverCard
          width={320}
          shadow="md"
          withArrow
          openDelay={200}
          closeDelay={400}
          zIndex={99999999}
        >
          
    
      {/* HoverCard should only trigger when hovering over the Avatar and Text */}
      <Group justify="center" style={{ display: 'flex', alignItems: 'center' }}>
        <HoverCard.Target>
  <UnstyledButton
    component={Link}
    href={`/wave/${postContent.by?.handle?.localName}`}
     style={{ display: 'flex', alignItems: 'center' }}
  >
        <Avatar
          // @ts-ignore
          src={
            postContent?.by?.metadata?.picture &&
            "optimized" in postContent?.by?.metadata?.picture
              ? postContent.by.metadata.picture.optimized?.uri
              : "https://gw.ipfs-lens.dev/ipfs/bafybeidkewnnnisaqmwk7ornt6fymjddlkhlou2tsfhaxxnird4w4yrebe"
          }
          alt={`${postContent.by?.handle?.localName}'s profile picture`}
          size="lg"
        />
        <Space w="xs"/>
        <Text fw={500}>
          {postContent.by?.metadata?.displayName ||
            postContent.by?.handle?.localName}
        </Text>
         </UnstyledButton>
</HoverCard.Target>
      </Group>
    
 


         
            <HoverCard.Dropdown>
              <Group>
                <Avatar
                  // @ts-ignore
                  src={
                    postContent?.by?.metadata?.picture &&
                    "optimized" in postContent?.by?.metadata?.picture
                      ? postContent.by.metadata.picture.optimized?.uri
                      : "https://gw.ipfs-lens.dev/ipfs/bafybeidkewnnnisaqmwk7ornt6fymjddlkhlou2tsfhaxxnird4w4yrebe"
                  }
                  alt={`${postContent.by?.handle?.localName}'s profile picture`}
                  size="lg"
                />

                <div style={{ flex: 1 }}>
                  <Text size="md" fw={500}>
                    {postContent.by?.metadata?.displayName ||
                      postContent.by?.handle?.localName}
                  </Text>

                  <Text c="dimmed" size="sm">
                    @{postContent.by?.handle?.localName}
                  </Text>
                </div>
              </Group>
              <Space h="md" />
              <Text lineClamp={3} fw={200}>
                {
                  // @ts-ignore
                  postContent.by.metadata?.bio || null
                }
              </Text>
              <Space h="md" />
              <Group justify="center">
                <Text fw={500} size="sm">
                  {
                    // @ts-ignore
                    postContent.by.stats.followers || "0"
                  }{" "}
                  Followers
                </Text>
                |
                <Text fw={500} size="sm">
                  {
                    // @ts-ignore
                    postContent.by.stats.following || "0"
                  }{" "}
                  Following
                </Text>
              </Group>
            </HoverCard.Dropdown>
          
        </HoverCard>

        <Space h="xl" />

        <Center>
       
              <Text
                size="md"
                style={{
              maxWidth: "100%",  // Ensure message text does not overflow
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "normal",  // Allow text to wrap
              wordWrap: "break-word",
               textAlign: "center",  // Allow long words to break
                }}
                
                dangerouslySetInnerHTML={{
                  __html:
                    // @ts-ignore
                    postContent?.metadata?.content
                      ? replaceURLs(
                          // @ts-ignore
                          postContent.metadata.content.replace(/\n/g, "<br> "),
                        )
                      : "",
                }}
              />
       
        </Center>
        <Space h="md" />

         

        {
          // @ts-ignore
          postToUse.metadata?.asset?.image && (
            
              <Image
                // @ts-ignore
                src={postToUse?.metadata?.asset?.image?.optimized?.uri}
                radius="xs"
                
                style={{
                  width: "100%", // Width is 100% of the container
                  maxWidth: "100%", // Ensures the image doesn't scale beyond its original size
                  maxHeight: "888px",
                }}
                alt={`${postToUse.by?.handle?.localName}'s Post Image`}
              />
         
          )
        }

        {
          // @ts-ignore
          postToUse?.metadata?.__typename === "VideoMetadataV3" &&
(


          <Player
                 // @ts-ignore
                src={postToUse?.metadata?.asset?.video?.optimized?.uri}
                aspectRatio="1to1"
                controls={{ autohide: 0, hotkeys: false, defaultVolume: 0.6 }}
                showPipButton
                theme={{
                colors: {
                  loading: '#3cdfff',
                }
        }}


              />
         
           
          )
        }

        {
          // @ts-ignore
          postToUse?.metadata?.asset?.audio && (
            <>
            {// @ts-ignore
            postContent?.metadata?.asset?.cover?.optimized?.uri && (
              <Image
                // @ts-ignore
                src={postContent?.metadata?.asset?.cover?.optimized?.uri}
                radius="xs"
                mt={22}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  maxHeight: "888px",
                }}
                alt={`${postToUse.by?.handle?.localName}'s Post Image`}
              />
            )}
            <Group grow>
              <AudioPlayer
                // @ts-ignore
                src={postContent?.metadata?.asset?.audio?.optimized?.uri}
                color="#0099ff"
				        sliderColor="#0099ff"
				        style={{ background: '#000'}}
              />
              </Group>
              </>
            
          )
        }
<Space h="sm"/>


        {post.__typename === "Quote" && (
          <Paper shadow="xl" radius="md" p="xs" withBorder>
            <Group justify="right">
              <Text c="dimmed" size="xs" fw={500} mr={10}>
                {
                  // @ts-ignore
                  formatDate(postToUse.quoteOn.createdAt)
                }{" "}
                ago
              </Text>
            </Group>

            
                <HoverCard
          width={320}
          shadow="md"
          withArrow
          openDelay={200}
          closeDelay={400}
        >
          
    
      {/* HoverCard should only trigger when hovering over the Avatar and Text */}
      <Group justify="center" style={{ display: 'flex', alignItems: 'center' }}>
        <HoverCard.Target>
  <UnstyledButton
              component={Link}
              // @ts-ignore
              href={`/wave/${postToUse.quoteOn.by?.handle?.localName}`}
            >
              <Group justify="center">
                <Avatar
                  src={
                    // @ts-ignore
                    postToUse?.quoteOn.by?.metadata?.picture?.optimized?.uri ||
                    "https://gw.ipfs-lens.dev/ipfs/bafybeidkewnnnisaqmwk7ornt6fymjddlkhlou2tsfhaxxnird4w4yrebe"
                  }
                  alt={
                    // @ts-ignore
                    `${postToUse.quoteOn.by?.handle?.localName}'s profile picture`
                  }
                  size="lg"
                />

                <Text fw={500}>
                  {
                    
                    // @ts-ignore
                    postToUse.quoteOn.by?.metadata?.displayName || postToUse.quoteOn.by?.handle?.localName
                  }
                </Text>
              </Group>
            </UnstyledButton>
</HoverCard.Target>
      </Group>
    
 


         
            <HoverCard.Dropdown>
              <Group>
               <Avatar
                  src={
                    // @ts-ignore
                    postToUse?.quoteOn.by?.metadata?.picture?.optimized?.uri ||
                    "https://gw.ipfs-lens.dev/ipfs/bafybeidkewnnnisaqmwk7ornt6fymjddlkhlou2tsfhaxxnird4w4yrebe"
                  }
                  alt={
                    // @ts-ignore
                    `${postToUse.quoteOn.by?.handle?.localName}'s profile picture`
                  }
                  size="lg"
                />


                <div style={{ flex: 1 }}>
                   <Text fw={500}>
                  {
                    // @ts-ignore
                    postToUse.quoteOn.by?.metadata?.displayName || postToUse.quoteOn.by?.handle?.localName
                  }
                </Text>

                  <Text c="dimmed" size="sm">
                    @{// @ts-ignore
                    postToUse.quoteOn.by?.handle?.localName}
                  </Text>
                </div>
              </Group>
              <Space h="md" />
              <Text lineClamp={3} fw={200}>
                {
                  // @ts-ignore
                    postToUse.quoteOn.by?.metadata?.bio || null
                }
              </Text>
              <Space h="md" />
              <Group justify="center">
                <Text fw={500} size="sm">
                  {
                    // @ts-ignore
                    postToUse.quoteOn.by?.stats.followers || "0"
                  }{" "}
                  Followers
                </Text>
                |
                <Text fw={500} size="sm">
                  {
                    // @ts-ignore
                    postToUse.quoteOn.by?.stats.following || "0"
                  }{" "}
                  Following
                </Text>
              </Group>
            </HoverCard.Dropdown>
          
        </HoverCard>
            <Space h="xl" />

            <Center>
           
                <div
                  style={{
                    maxWidth: "100%", // Adjust this value to control the maximum width
                    margin: "0 auto", // Center the content horizontally if needed
                  }}
                >
                  {/* Post content */}
                  <Text
                    size="md"
                    style={{
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      textAlign: "center",
                    }}
                    dangerouslySetInnerHTML={{
                      __html:
                        // @ts-ignore
                        postToUse?.quoteOn?.metadata?.content
                          ? replaceURLs(
                              // @ts-ignore
                              postToUse.quoteOn.metadata.content.replace(
                                /\n/g,
                                "<br> ",
                              ),
                            )
                          : "",
                    }}
                  />
                </div>
            
            </Center>
            <Space h="md" />
            {
              // @ts-ignore
              postToUse.quoteOn.metadata?.asset?.image && (
                <Center>
                  <Image
                    src={
                      // @ts-ignore
                      postToUse?.quoteOn?.metadata?.asset?.image?.optimized?.uri
                    }
                    radius="xs"
                    style={{
                      width: "100%", // Width is 100% of the container
                      height: "auto", // Height is auto to maintain aspect ratio
                      maxWidth: "100%", // Ensures the image doesn't scale beyond its original size
                    }}
                    alt={
                      // @ts-ignore
                      `${postToUse?.quoteOn?.by?.handle?.localName}'s Post Image`
                    }
                  />
                </Center>
              )
            }

            {
              // @ts-ignore
              postToUse?.quoteOn?.metadata?.asset?.video && (
                <Center>
                  <Player
                    src={
                      // @ts-ignore
                      postToUse.quoteOn?.metadata?.asset?.video?.optimized?.uri
                    }
                  />
                </Center>
              )
            }

            {
          // @ts-ignore
          postToUse?.quoteOn?.metadata?.asset?.audio && (
            <>
            {// @ts-ignore
            postToUse?.quoteOn?.metadata?.asset?.cover?.optimized?.uri && (
              <Image
                // @ts-ignore
                src={postToUse?.quoteOn?.metadata?.asset?.cover?.optimized?.uri}
                radius="xs"
                mt={22}
                style={{
                  width: "100%", // Width is 100% of the container
                  maxWidth: "100%", // Ensures the image doesn't scale beyond its original size
                  maxHeight: "888px",
                }}
                alt={`${// @ts-ignore
                  postToUse?.quoteOn?.by?.handle?.localName}'s Post Image`}
              />
            )}
            <Group grow>
              <AudioPlayer
                // @ts-ignore
                src={postToUse?.quoteOn?.metadata?.asset?.audio?.optimized?.uri}
                color="#0099ff"
				        sliderColor="#0099ff"
				        style={{ background: '#000'}}
              />
              </Group>
              </>
            
          )
        }

            {
              // @ts-ignore
              postToUse?.quoteOn?.metadata?.embed && (
                <Center>
                  <Player // @ts-ignore
                    src={postToUse?.quoteOn?.metadata?.embed}
                  />
                </Center>
              )
            }
          </Paper>
        )}

        <Space h="xl" />

        {/* Post metadata */}
        <Container fluid>
          <Group justify="center">
            {/* Comments - Take user to the post */}
            <Tooltip position="bottom" label="Comment">
              <ActionIcon
                variant="subtle"
                radius="md"
                size={36}
                onClick={(e: any) => {
                  router.push(`/post/${postToUse?.id}`);
                  e.stopPropagation();
                }}
              >
                <IconMessageCircle size={18} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
            <Text size="xs" c="dimmed">
              {postContent?.stats?.comments}
            </Text>

            {/* Mirrors */}
            <Tooltip position="bottom" label="Mirror">
              <ActionIcon
                variant="subtle"
                radius="md"
                size={36}
                onClick={async (e: any) => {
                  try {
                    e.stopPropagation();
                    if (session) {
                      notifications.show({
                        title: "Lens V2 Upgrade",
                        icon: <IconExclamationMark size="1.1rem" />,
                        color: "blue",
                        message:
                          "Waves is upgrading to Lens v2. This will work soon... hopefully. ",
                      });
                    } else {
                      // Handle the case when activeProfile.data is falsy (button disabled)
                      notifications.show({
                        title: "Error",
                        icon: <IconX size="1.1rem" />,
                        color: "red",
                        message: `Login to mirror this post!`,
                      });
                    }
                  } catch (error) {
                    console.error(error);
                    notifications.show({
                      title: "Error",
                      icon: <IconX size="1.1rem" />,
                      color: "red",
                      message: `Something Happened: ${error}`,
                    });
                  }
                }}
              >
                <GiMirrorMirror size={18} />
              </ActionIcon>
            </Tooltip>
            <Text size="xs" c="dimmed">
              {postContent?.stats?.mirrors}
            </Text>

             {/* Hearts */}
             {// @ts-ignore
               postToUse?.operations?.hasUpvoted ? (
               <div ref={ref}>
                <Tooltip label="Remove Upvote">
                <ActionIcon
                
                variant="subtle"
                radius="md"
                size={36}
                onClick={ async (e: any) => {
                  e.stopPropagation();
                  try {
                    if (!session?.authenticated) {
                      notifications.show({
                        title: "Error",
                        icon: <IconX size="1.1rem" />,
                        color: "red",
                        message: `Login to like this post!`,
                      });
                      return; // Return early to prevent further execution
                    }

                    await react({
                      reaction: PublicationReactionType.Upvote,
                      publication: postToUse as PrimaryPublication,
                    });
                    notifications.show({
                      title: "Success",
                      icon: <FaHeartBroken size="1.1rem" />,
                      color: "blue",
                      message: "Successfully removed upvote!",
                    });
                  } catch (error) {
                    notifications.show({
                      title: "Error",
                      icon: <IconX size="1.1rem" />,
                      color: "red",
                      message: `Something Happened! ${error}`,
                    });
                    
                  }
                }}
              >
               {hovered ? <FaHeartBroken size={18} /> : <IconHeartFilled size={18} stroke={1.5} /> }
                </ActionIcon>
                </Tooltip>
                </div>
               ) : (
                <Tooltip label="Upvote">
                <ActionIcon
                variant="subtle"
                radius="md"
                size={36}
                onClick={ async (e: any) => {
                  e.stopPropagation();
                  try {
                    if (!session?.authenticated) {
                      notifications.show({
                        title: "Error",
                        icon: <IconX size="1.1rem" />,
                        color: "red",
                        message: `Login to like this post!`,
                      });
                      return; // Return early to prevent further execution
                    }

                    await react({
                      reaction: PublicationReactionType.Upvote,
                      publication: postToUse as PrimaryPublication,
                    });
                    notifications.show({
                      title: "Success",
                      icon: <IconHeartFilled size="1.1rem" />,
                      color: "blue",
                      message: `You Liked ${
                        postToUse.by?.handle?.localName || "Anon"
                      }'s post. Keep it going!`,
                    });
                  } catch (error) {
                    notifications.show({
                      title: "Error",
                      icon: <IconX size="1.1rem" />,
                      color: "red",
                      message: `Something Happened! ${error}`,
                    });
                    
                  }
                }}
              >
                <IconHeart size={18} stroke={1.5} />
                </ActionIcon>
                </Tooltip>
               )}
            <Text size="xs" c="dimmed">
              {postContent?.stats?.upvotes}
            </Text>
            <Tooltip position="bottom" label="Collect">
              <ActionIcon variant="subtle" radius="md" size={36}>
                <IconStack3 size={18} stroke={1.5} />
              </ActionIcon>
            </Tooltip>
            <Text size="xs" c="dimmed">
              {postContent?.stats?.collects}
            </Text>
          </Group>
        </Container>
        <Space h="lg" />
      </Paper>
      <Space h="md" />
    </>
  );
}
